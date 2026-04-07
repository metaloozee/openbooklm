import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectDocument } from "@/lib/db/schema";
import { getDocumentBlob } from "@/lib/documents/blob-storage";

const PDF_CONTENT_TYPE = "application/pdf";
const MARKDOWN_CONTENT_TYPES = new Set(["text/markdown", "text/x-markdown"]);
const MARKDOWN_FILE_EXTENSION = ".md";
const PDF_FILE_EXTENSION = ".pdf";

const isInlineDisplayDocument = ({
  contentType,
  filename,
}: {
  contentType: string | null;
  filename: string;
}): boolean => {
  const normalizedContentType = contentType?.trim().toLowerCase() ?? "";
  const normalizedFilename = filename.trim().toLowerCase();

  if (normalizedContentType === PDF_CONTENT_TYPE) {
    return true;
  }

  if (MARKDOWN_CONTENT_TYPES.has(normalizedContentType)) {
    return true;
  }

  if (normalizedFilename.endsWith(PDF_FILE_EXTENSION)) {
    return true;
  }

  return normalizedFilename.endsWith(MARKDOWN_FILE_EXTENSION);
};

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
    return new Response("Unauthorized.", { status: 401 });
  }

  const { key } = await params;
  const objectKey = key?.join("/") ?? "";

  if (objectKey.length === 0) {
    return new Response("Missing object key.", { status: 400 });
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
    return new Response("Object not found.", { status: 404 });
  }

  const blob = await getDocumentBlob(documentRecord.objectKey);

  if (!blob || blob.statusCode !== 200) {
    return new Response("Object not found.", { status: 404 });
  }

  const headers = new Headers();

  headers.set(
    "content-type",
    documentRecord.contentType ?? "application/octet-stream"
  );

  const dispositionType = isInlineDisplayDocument({
    contentType: documentRecord.contentType,
    filename: documentRecord.originalFilename,
  })
    ? "inline"
    : "attachment";

  headers.set(
    "content-disposition",
    `${dispositionType}; filename*=UTF-8''${encodeURIComponent(documentRecord.originalFilename)}`
  );

  return new Response(blob.stream, { headers });
};
