import { and, eq } from "drizzle-orm";

import { getAuthSession } from "@/lib/auth";
import { getDbAsync } from "@/lib/db";
import { project, projectDocument } from "@/lib/db/schema";
import {
  createDocumentObjectKey,
  getDocumentsBucket,
  resolveDocumentUploadContentType,
} from "@/lib/r2";

export const POST = async (request: Request): Promise<Response> => {
  const session = await getAuthSession(request.headers);

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = formData.get("projectId");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file upload." }, { status: 400 });
  }

  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return Response.json({ error: "Missing project id." }, { status: 400 });
  }

  const db = await getDbAsync();
  const [ownedProject] = await db
    .select({
      id: project.id,
    })
    .from(project)
    .where(
      and(eq(project.id, projectId), eq(project.ownerUserId, session.user.id))
    )
    .limit(1);

  if (!ownedProject) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const bucket = await getDocumentsBucket();
  const key = createDocumentObjectKey(file.name);
  const contentType = resolveDocumentUploadContentType(file.name, file.type);

  if (!contentType) {
    return Response.json(
      {
        error:
          "Unsupported document type. Allowed files: PDF, TXT, MD, DOC, DOCX.",
      },
      { status: 400 }
    );
  }

  let uploadSucceeded = false;

  try {
    await bucket.put(key, file, {
      customMetadata: {
        originalFilename: file.name,
        ownerUserId: session.user.id,
      },
      httpMetadata: {
        contentType,
      },
    });
    uploadSucceeded = true;

    const [createdDocument] = await db
      .insert(projectDocument)
      .values({
        contentType,
        id: crypto.randomUUID(),
        objectKey: key,
        originalFilename: file.name,
        ownerUserId: session.user.id,
        projectId: ownedProject.id,
        sizeBytes: file.size,
      })
      .returning({
        id: projectDocument.id,
        objectKey: projectDocument.objectKey,
        projectId: projectDocument.projectId,
      });

    return Response.json(createdDocument, { status: 201 });
  } catch (error) {
    if (uploadSucceeded) {
      try {
        await bucket.delete(key);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded document after error.", {
          cleanupError,
          key,
          originalError: error,
        });
      }
    }

    return Response.json(
      { error: "Unable to upload document." },
      { status: 500 }
    );
  }
};
