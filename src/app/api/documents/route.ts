import { del } from "@vercel/blob";
import { start } from "workflow/api";

import { auth } from "@/lib/auth";
import { putDocumentBlob } from "@/lib/documents/blob-storage";
import { validateDocumentUpload } from "@/lib/documents/file-types";
import {
  buildDocumentObjectKey,
  createQueuedProjectDocument,
  getOwnedProject,
  markDocumentAsFailed,
} from "@/lib/documents/ingestion";
import { processDocumentWorkflow } from "@/workflows/process-document";

export const maxDuration = 60;

export const POST = async (request: Request): Promise<Response> => {
  const session = await auth.api.getSession({ headers: request.headers });

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

  const validationError = validateDocumentUpload({
    contentType: file.type || null,
    filename: file.name,
    sizeBytes: file.size,
  });

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const ownerUserId = session.user.id;
  const normalizedProjectId = projectId.trim();
  const documentId = crypto.randomUUID();

  const foundProject = await getOwnedProject({
    ownerUserId,
    projectId: normalizedProjectId,
  });

  if (!foundProject) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const objectKey = buildDocumentObjectKey({
    documentId,
    filename: file.name,
    ownerUserId,
    projectId: normalizedProjectId,
  });

  try {
    await putDocumentBlob(objectKey, file, {
      contentType: file.type || undefined,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload the document to storage.",
      },
      { status: 500 }
    );
  }

  let createdDocument;

  try {
    createdDocument = await createQueuedProjectDocument({
      contentType: file.type || null,
      documentId,
      objectKey,
      originalFilename: file.name,
      ownerUserId,
      projectId: normalizedProjectId,
      sizeBytes: file.size,
    });
  } catch {
    try {
      await del(objectKey);
    } catch {
      // Ignore cleanup failures after the DB record write fails.
    }

    return Response.json(
      { error: "Failed to create the document record." },
      { status: 500 }
    );
  }

  try {
    await start(processDocumentWorkflow, [
      {
        documentId,
        ownerUserId,
      },
    ]);
  } catch (error) {
    createdDocument = await markDocumentAsFailed({
      documentId,
      errorMessage:
        error instanceof Error && error.message.length > 0
          ? error.message
          : "Failed to start background processing.",
      ownerUserId,
    });
  }

  return Response.json(createdDocument, { status: 201 });
};
