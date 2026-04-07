import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectDocument } from "@/lib/db/schema";
import { getDocumentBlob } from "@/lib/documents/blob-storage";

const STORAGE_KEY_SEGMENT_REGEX = /^[a-zA-Z0-9._-]+$/;
const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_CONTENT_TYPE = "application/pdf";
const MARKDOWN_CONTENT_TYPES = new Set(["text/markdown", "text/x-markdown"]);
const TEXT_CONTENT_TYPE = "text/plain";
const DEFAULT_CONTENT_TYPE = "application/octet-stream";
const TRUSTED_DOCUMENT_CONTENT_TYPES = new Set([
  DOCX_CONTENT_TYPE,
  PDF_CONTENT_TYPE,
  TEXT_CONTENT_TYPE,
  ...MARKDOWN_CONTENT_TYPES,
]);
const INLINE_DOCUMENT_CONTENT_TYPES = new Set([
  PDF_CONTENT_TYPE,
  TEXT_CONTENT_TYPE,
  ...MARKDOWN_CONTENT_TYPES,
]);

const normalizeMimeType = (contentType: string | null): string =>
  contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";

const sanitizeObjectKey = (segments: string[] | undefined): string | null => {
  if (!segments || segments.length === 0) {
    return null;
  }

  const sanitizedSegments: string[] = [];

  for (const segment of segments) {
    const trimmedSegment = segment.trim();

    if (
      trimmedSegment.length === 0 ||
      trimmedSegment === "." ||
      trimmedSegment === ".." ||
      !STORAGE_KEY_SEGMENT_REGEX.test(trimmedSegment)
    ) {
      return null;
    }

    sanitizedSegments.push(trimmedSegment);
  }

  return sanitizedSegments.join("/");
};

const sanitizeDownloadFilename = (filename: string): string => {
  const basename = filename.split(/[/\\]/).pop() ?? "document";

  let withoutControlCharacters = "";

  for (const character of basename) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (codePoint < 32 || codePoint === 127) {
      continue;
    }

    withoutControlCharacters += character;
  }

  const sanitized = withoutControlCharacters
    .replaceAll(/[<>:"|?*;]/g, "_")
    .trim();

  return sanitized.length > 0 ? sanitized : "document";
};

const isInlineDisplayDocument = (trustedContentType: string): boolean =>
  INLINE_DOCUMENT_CONTENT_TYPES.has(trustedContentType);

interface DocumentRouteContext {
  params: Promise<{
    key?: string[];
  }>;
}

export const GET = async (
  request: Request,
  { params }: DocumentRouteContext
): Promise<Response> => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Unauthorized.", {
      headers: {
        "x-content-type-options": "nosniff",
      },
      status: 401,
    });
  }

  const { key } = await params;
  const objectKey = sanitizeObjectKey(key);

  if (!objectKey) {
    return new Response("Missing object key.", {
      headers: {
        "x-content-type-options": "nosniff",
      },
      status: 400,
    });
  }

  const [documentRecord] = await db
    .select({
      contentType: projectDocument.contentType,
      objectKey: projectDocument.objectKey,
      originalFilename: projectDocument.originalFilename,
    })
    .from(projectDocument)
    .where(
      and(
        eq(projectDocument.objectKey, objectKey),
        eq(projectDocument.ownerUserId, session.user.id)
      )
    )
    .limit(1);

  if (!documentRecord) {
    return new Response("Object not found.", {
      headers: {
        "x-content-type-options": "nosniff",
      },
      status: 404,
    });
  }

  const blob = await getDocumentBlob(documentRecord.objectKey);

  if (!blob || blob.statusCode !== 200) {
    return new Response("Object not found.", {
      headers: {
        "x-content-type-options": "nosniff",
      },
      status: 404,
    });
  }

  const trustedContentTypeCandidates = [
    normalizeMimeType(blob.blob.contentType),
    normalizeMimeType(documentRecord.contentType),
  ];

  const trustedContentType =
    trustedContentTypeCandidates.find((contentType) =>
      TRUSTED_DOCUMENT_CONTENT_TYPES.has(contentType)
    ) ?? DEFAULT_CONTENT_TYPE;

  const sanitizedFilename = sanitizeDownloadFilename(
    documentRecord.originalFilename
  );

  const headers = new Headers();

  headers.set("content-type", trustedContentType);
  headers.set("x-content-type-options", "nosniff");

  const dispositionType = isInlineDisplayDocument(trustedContentType)
    ? "inline"
    : "attachment";

  headers.set(
    "content-disposition",
    `${dispositionType}; filename*=UTF-8''${encodeURIComponent(sanitizedFilename)}`
  );

  return new Response(blob.stream, { headers });
};
