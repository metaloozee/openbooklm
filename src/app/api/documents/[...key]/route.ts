import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectDocument } from "@/lib/db/schema";

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

  const headers = new Headers();

  headers.set(
    "content-type",
    documentRecord.contentType ?? "application/octet-stream"
  );
  headers.set(
    "content-disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(documentRecord.originalFilename)}`
  );

  return new Response(null, { headers });
};
