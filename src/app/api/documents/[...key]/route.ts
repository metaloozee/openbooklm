import { and, eq } from "drizzle-orm";

import { getAuthSession } from "@/lib/auth";
import { getDbAsync } from "@/lib/db";
import { projectDocument } from "@/lib/db/schema";
import {
  canRenderDocumentInline,
  getDocumentsBucket,
  getSafeDocumentResponseContentType,
} from "@/lib/r2";

interface DocumentRouteContext {
  params: Promise<{
    key?: string[];
  }>;
}

export const GET = async (
  request: Request,
  { params }: DocumentRouteContext
): Promise<Response> => {
  const session = await getAuthSession(request.headers);
  const requestUrl = new URL(request.url);
  const shouldDownload = requestUrl.searchParams.get("download") === "1";

  if (!session) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const { key } = await params;
  const objectKey = key?.join("/") ?? "";

  if (objectKey.length === 0) {
    return new Response("Missing object key.", { status: 400 });
  }

  const db = await getDbAsync();
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

  const bucket = await getDocumentsBucket();
  const object = await bucket.get(documentRecord.objectKey);

  if (!object) {
    return new Response("Object not found.", { status: 404 });
  }

  const headers = new Headers();
  const { httpMetadata, size } = object;
  const safeContentType = getSafeDocumentResponseContentType(
    documentRecord.contentType
  );
  const shouldRenderInline =
    !shouldDownload && canRenderDocumentInline(documentRecord.contentType);

  if (httpMetadata?.cacheControl) {
    headers.set("cache-control", httpMetadata.cacheControl);
  }

  if (httpMetadata?.contentEncoding) {
    headers.set("content-encoding", httpMetadata.contentEncoding);
  }

  if (httpMetadata?.contentLanguage) {
    headers.set("content-language", httpMetadata.contentLanguage);
  }

  headers.set("content-type", safeContentType);
  headers.set("content-length", size.toString());
  headers.set(
    "content-disposition",
    `${shouldRenderInline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(documentRecord.originalFilename)}`
  );
  headers.set("etag", object.httpEtag);
  headers.set("x-content-type-options", "nosniff");

  return new Response(object.body, { headers });
};
