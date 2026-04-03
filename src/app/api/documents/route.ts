import { and, eq } from "drizzle-orm";

import { getAuthSession } from "@/lib/auth";
import { getDbAsync } from "@/lib/db";
import { project, projectDocument } from "@/lib/db/schema";
import {
  createDocumentWorkflowInstanceId,
  DOCUMENT_PROCESSING_STATUS,
} from "@/lib/ingestion";
import type { DocumentIngestionParams } from "@/lib/ingestion";
import {
  createDocumentObjectKey,
  getDocumentsBucket,
  resolveDocumentUploadContentType,
} from "@/lib/r2";
import { getDocumentIngestionWorkflow } from "@/lib/workflow";

const documentSelection = {
  chunkCount: projectDocument.chunkCount,
  contentType: projectDocument.contentType,
  createdAt: projectDocument.createdAt,
  id: projectDocument.id,
  ingestionVersion: projectDocument.ingestionVersion,
  lastIngestionAttemptAt: projectDocument.lastIngestionAttemptAt,
  objectKey: projectDocument.objectKey,
  originalFilename: projectDocument.originalFilename,
  processedAt: projectDocument.processedAt,
  processingError: projectDocument.processingError,
  processingStartedAt: projectDocument.processingStartedAt,
  processingStatus: projectDocument.processingStatus,
  projectId: projectDocument.projectId,
  sizeBytes: projectDocument.sizeBytes,
  sourceTextObjectKey: projectDocument.sourceTextObjectKey,
  vectorCount: projectDocument.vectorCount,
};

export const maxDuration = 60;

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
    .select({ id: project.id })
    .from(project)
    .where(
      and(eq(project.id, projectId), eq(project.ownerUserId, session.user.id))
    )
    .limit(1);

  if (!ownedProject) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const bucket = await getDocumentsBucket();
  const objectKey = createDocumentObjectKey(file.name);
  const contentType = resolveDocumentUploadContentType(file.name, file.type);

  if (!contentType) {
    return Response.json(
      {
        error: "Unsupported document type. Allowed files: PDF, TXT, MD, DOCX.",
      },
      { status: 400 }
    );
  }

  let uploadSucceeded = false;

  try {
    await bucket.put(objectKey, file, {
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
        chunkCount: 0,
        contentType,
        id: crypto.randomUUID(),
        ingestionVersion: 1,
        objectKey,
        originalFilename: file.name,
        ownerUserId: session.user.id,
        processingStatus: DOCUMENT_PROCESSING_STATUS.QUEUED,
        projectId: ownedProject.id,
        sizeBytes: file.size,
        vectorCount: 0,
      })
      .returning(documentSelection);

    if (!createdDocument) {
      throw new Error("Failed to create document record.");
    }

    const workflowParams: DocumentIngestionParams = {
      contentType,
      documentId: createdDocument.id,
      ingestionVersion: createdDocument.ingestionVersion,
      objectKey: createdDocument.objectKey,
      originalFilename: createdDocument.originalFilename,
      ownerUserId: session.user.id,
      projectId: ownedProject.id,
    };

    const workflowInstanceId = createDocumentWorkflowInstanceId(
      createdDocument.id,
      createdDocument.ingestionVersion
    );

    try {
      const workflow = await getDocumentIngestionWorkflow();
      await workflow.create({
        id: workflowInstanceId,
        params: workflowParams,
      });
    } catch {
      const [failedDocument] = await db
        .update(projectDocument)
        .set({
          lastIngestionAttemptAt: new Date(),
          processedAt: new Date(),
          processingError:
            "Document uploaded, but background processing could not be started.",
          processingStatus: DOCUMENT_PROCESSING_STATUS.FAILED,
        })
        .where(eq(projectDocument.id, createdDocument.id))
        .returning(documentSelection);

      return Response.json(failedDocument ?? createdDocument, { status: 201 });
    }

    return Response.json(createdDocument, { status: 201 });
  } catch (error) {
    if (uploadSucceeded) {
      try {
        await bucket.delete(objectKey);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded document after error.", {
          cleanupError,
          objectKey,
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
