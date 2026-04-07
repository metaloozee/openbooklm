import "server-only";
import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  documentChunk,
  documentEmbedding,
  project,
  projectDocument,
} from "@/lib/db/schema";
import { putDocumentBlob } from "@/lib/documents/blob-storage";

const STORAGE_SEGMENT_REGEX = /[^a-zA-Z0-9._-]+/g;
const OCR_TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";

export const DOCUMENT_EMBEDDING_DIMENSIONS = 1024 as const;

export type OwnedProjectDocument = typeof projectDocument.$inferSelect;

export interface PersistedEmbeddingChunk {
  charEnd?: number | null;
  charStart?: number | null;
  content: string;
  embedding: number[];
}

const getPersistenceErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.length > 0) {
    if (error.message.includes("different vector dimensions")) {
      return `${error.message}. Your database vector schema is out of sync with application code. Run drizzle migrations to align vector dimensions.`;
    }

    return error.message;
  }

  return "Unknown persistence error";
};

const sanitizeStorageSegment = (value: string): string => {
  const sanitized = value.trim().replaceAll(STORAGE_SEGMENT_REGEX, "-");

  return sanitized.length > 0 ? sanitized : "document";
};

const updateOwnedDocument = async ({
  documentId,
  ownerUserId,
  values,
}: {
  documentId: string;
  ownerUserId: string;
  values: Partial<typeof projectDocument.$inferInsert>;
}) => {
  const [updatedDocument] = await db
    .update(projectDocument)
    .set(values)
    .where(
      and(
        eq(projectDocument.id, documentId),
        eq(projectDocument.ownerUserId, ownerUserId)
      )
    )
    .returning();

  if (!updatedDocument) {
    throw new Error("Document not found");
  }

  return updatedDocument;
};

export const buildDocumentObjectKey = ({
  documentId,
  filename,
  ownerUserId,
  projectId,
}: {
  documentId: string;
  filename: string;
  ownerUserId: string;
  projectId: string;
}) =>
  [
    "documents",
    sanitizeStorageSegment(ownerUserId),
    sanitizeStorageSegment(projectId),
    sanitizeStorageSegment(documentId),
    sanitizeStorageSegment(filename),
  ].join("/");

export const buildSourceTextObjectKey = ({
  documentId,
  ownerUserId,
  projectId,
}: {
  documentId: string;
  ownerUserId: string;
  projectId: string;
}) =>
  [
    "documents",
    sanitizeStorageSegment(ownerUserId),
    sanitizeStorageSegment(projectId),
    sanitizeStorageSegment(documentId),
    "source.txt",
  ].join("/");

const buildSourceTextStagingObjectKey = ({
  documentId,
  ownerUserId,
  projectId,
}: {
  documentId: string;
  ownerUserId: string;
  projectId: string;
}) =>
  [
    "documents",
    sanitizeStorageSegment(ownerUserId),
    sanitizeStorageSegment(projectId),
    sanitizeStorageSegment(documentId),
    `source.staging-${crypto.randomUUID()}.txt`,
  ].join("/");

const tryDeleteBlob = async (objectKey: string): Promise<string | null> => {
  try {
    await del(objectKey);
    return null;
  } catch (error) {
    return getPersistenceErrorMessage(error);
  }
};

export const getOwnedProject = async ({
  ownerUserId,
  projectId,
}: {
  ownerUserId: string;
  projectId: string;
}) => {
  const [foundProject] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.ownerUserId, ownerUserId)))
    .limit(1);

  return foundProject ?? null;
};

export const getOwnedDocument = async ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) => {
  const [foundDocument] = await db
    .select()
    .from(projectDocument)
    .where(
      and(
        eq(projectDocument.id, documentId),
        eq(projectDocument.ownerUserId, ownerUserId)
      )
    )
    .limit(1);

  return foundDocument ?? null;
};

export const createQueuedProjectDocument = async ({
  contentType,
  documentId,
  objectKey,
  originalFilename,
  ownerUserId,
  projectId,
  sizeBytes,
}: {
  contentType: string | null;
  documentId: string;
  objectKey: string;
  originalFilename: string;
  ownerUserId: string;
  projectId: string;
  sizeBytes: number;
}) => {
  const [createdDocument] = await db
    .insert(projectDocument)
    .values({
      contentType,
      id: documentId,
      lastIngestionAttemptAt: new Date(),
      objectKey,
      originalFilename,
      ownerUserId,
      processingStatus: "queued",
      projectId,
      sizeBytes,
    })
    .returning();

  if (!createdDocument) {
    throw new Error("Failed to create document");
  }

  return createdDocument;
};

export const markDocumentAsParsing = ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) =>
  updateOwnedDocument({
    documentId,
    ownerUserId,
    values: {
      chunkCount: 0,
      lastIngestionAttemptAt: new Date(),
      processedAt: null,
      processingError: null,
      processingStartedAt: new Date(),
      processingStatus: "parsing",
      sourceTextObjectKey: null,
      vectorCount: 0,
    },
  });

export const markDocumentAsChunking = ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) =>
  updateOwnedDocument({
    documentId,
    ownerUserId,
    values: {
      processingError: null,
      processingStatus: "chunking",
    },
  });

export const markDocumentAsEmbedding = ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) =>
  updateOwnedDocument({
    documentId,
    ownerUserId,
    values: {
      processingError: null,
      processingStatus: "embedding",
    },
  });

export const markDocumentAsFailed = ({
  documentId,
  errorMessage,
  ownerUserId,
}: {
  documentId: string;
  errorMessage: string;
  ownerUserId: string;
}) =>
  updateOwnedDocument({
    documentId,
    ownerUserId,
    values: {
      processedAt: null,
      processingError: errorMessage,
      processingStatus: "failed",
    },
  });

export const persistDocumentEmbeddings = async ({
  document,
  normalizedText,
  persistedChunks,
}: {
  document: OwnedProjectDocument;
  normalizedText: string;
  persistedChunks: PersistedEmbeddingChunk[];
}) => {
  if (persistedChunks.length === 0) {
    throw new Error("No chunks were generated for the document");
  }

  const sourceTextObjectKey = buildSourceTextObjectKey({
    documentId: document.id,
    ownerUserId: document.ownerUserId,
    projectId: document.projectId,
  });

  const sourceTextStagingObjectKey = buildSourceTextStagingObjectKey({
    documentId: document.id,
    ownerUserId: document.ownerUserId,
    projectId: document.projectId,
  });

  let hasStagingBlob = false;
  let hasFinalBlob = false;

  try {
    await putDocumentBlob(sourceTextStagingObjectKey, normalizedText, {
      allowOverwrite: true,
      contentType: OCR_TEXT_CONTENT_TYPE,
    });
    hasStagingBlob = true;
  } catch (error) {
    throw new Error(
      `Failed to store source text staging blob at "${sourceTextStagingObjectKey}": ${getPersistenceErrorMessage(error)}`,
      { cause: error }
    );
  }

  try {
    const updatedDocument = await db.transaction(async (tx) => {
      await tx
        .delete(documentChunk)
        .where(eq(documentChunk.documentId, document.id));

      const chunkRows = persistedChunks.map((chunk, chunkIndex) => {
        const vectorId = crypto.randomUUID();

        return {
          charEnd: chunk.charEnd ?? null,
          charStart: chunk.charStart ?? null,
          chunkIndex,
          documentId: document.id,
          id: crypto.randomUUID(),
          ownerUserId: document.ownerUserId,
          projectId: document.projectId,
          text: chunk.content,
          vectorId,
        };
      });

      const insertedChunks = await tx
        .insert(documentChunk)
        .values(chunkRows)
        .returning({
          id: documentChunk.id,
          vectorId: documentChunk.vectorId,
        });

      const embeddingRows = insertedChunks.map((chunk, chunkIndex) => ({
        chunkId: chunk.id,
        documentId: document.id,
        embedding: persistedChunks[chunkIndex].embedding,
        id: crypto.randomUUID(),
        ownerUserId: document.ownerUserId,
        projectId: document.projectId,
        vectorId: chunk.vectorId,
      }));

      try {
        await tx.insert(documentEmbedding).values(embeddingRows);
      } catch (embeddingError) {
        const stagingCleanupError = hasStagingBlob
          ? await tryDeleteBlob(sourceTextStagingObjectKey)
          : null;

        if (!stagingCleanupError) {
          hasStagingBlob = false;
        }

        if (stagingCleanupError) {
          throw new Error(
            `Failed to insert embeddings and to delete staging blob "${sourceTextStagingObjectKey}": ${stagingCleanupError}`,
            { cause: embeddingError }
          );
        }

        throw embeddingError;
      }

      await putDocumentBlob(sourceTextObjectKey, normalizedText, {
        allowOverwrite: true,
        contentType: OCR_TEXT_CONTENT_TYPE,
      });

      hasFinalBlob = true;

      const stagingCleanupError = hasStagingBlob
        ? await tryDeleteBlob(sourceTextStagingObjectKey)
        : null;

      if (!stagingCleanupError) {
        hasStagingBlob = false;
      }

      if (stagingCleanupError) {
        throw new Error(
          `Stored final source text blob but failed to delete staging blob "${sourceTextStagingObjectKey}": ${stagingCleanupError}`
        );
      }

      const [updated] = await tx
        .update(projectDocument)
        .set({
          chunkCount: chunkRows.length,
          processedAt: new Date(),
          processingError: null,
          processingStatus: "ready",
          sourceTextObjectKey,
          vectorCount: embeddingRows.length,
        })
        .where(
          and(
            eq(projectDocument.id, document.id),
            eq(projectDocument.ownerUserId, document.ownerUserId)
          )
        )
        .returning();

      if (!updated) {
        throw new Error("Document not found during final status update");
      }

      return updated;
    });

    return updatedDocument;
  } catch (error) {
    const cleanupErrors: string[] = [];

    if (hasStagingBlob) {
      const stagingCleanupError = await tryDeleteBlob(
        sourceTextStagingObjectKey
      );
      if (stagingCleanupError) {
        cleanupErrors.push(
          `staging blob cleanup failed for "${sourceTextStagingObjectKey}": ${stagingCleanupError}`
        );
      }
    }

    if (hasFinalBlob) {
      const finalCleanupError = await tryDeleteBlob(sourceTextObjectKey);
      if (finalCleanupError) {
        cleanupErrors.push(
          `final blob cleanup failed for "${sourceTextObjectKey}": ${finalCleanupError}`
        );
      }
    }

    const cleanupSuffix =
      cleanupErrors.length > 0
        ? ` Cleanup errors: ${cleanupErrors.join("; ")}`
        : "";

    throw new Error(
      `Failed to write document chunks/embeddings for document "${document.id}": ${getPersistenceErrorMessage(error)}${cleanupSuffix}`,
      { cause: error }
    );
  }
};
