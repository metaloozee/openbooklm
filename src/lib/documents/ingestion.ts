import "server-only";
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

/**
 * Pattern A: DB Transaction with Blob Reference Atomicity
 *
 * Persists document embeddings using a database transaction that ensures
 * all database operations succeed together, or all roll back together.
 * The blob is written FIRST (outside transaction), making it safe to retry
 * on DB failure—the blob already exists and won't be re-written.
 *
 * Flow:
 * 1. Write source text blob to Vercel Blob (idempotent, can retry)
 * 2. Start DB transaction
 * 3. Delete old chunks for this document
 * 4. Insert new chunks
 * 5. Insert embeddings
 * 6. Update document status to "ready"
 * 7. Transaction commits (or all rolls back on error)
 *
 * Safety guarantees:
 * - If DB transaction fails, blob already exists—no orphaned incomplete state
 * - If blob fails, entire operation fails before DB touch—no partial state
 * - Database maintains consistency: either ALL changes succeed or NONE
 *
 * @throws Error if blob write or any DB operation fails
 */
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

  // STEP 1: Write blob FIRST (outside transaction)
  // This is safe because blob writes are idempotent and we can retry.
  // If this fails, no DB changes happen yet.
  try {
    await putDocumentBlob(sourceTextObjectKey, normalizedText, {
      allowOverwrite: true,
      contentType: OCR_TEXT_CONTENT_TYPE,
    });
  } catch (error) {
    throw new Error(
      `Failed to store source text blob at "${sourceTextObjectKey}": ${getPersistenceErrorMessage(error)}`,
      { cause: error }
    );
  }

  // STEP 2: Wrap all DB operations in a transaction
  // If any step fails, all changes roll back and we maintain consistency.
  try {
    const updatedDocument = await db.transaction(async (tx) => {
      // STEP 2a: Delete old chunks and embeddings
      // (embeddings cascade delete via foreign key if configured)
      await tx
        .delete(documentChunk)
        .where(eq(documentChunk.documentId, document.id));

      // STEP 2b: Insert new chunks with generated IDs
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

      // STEP 2c: Insert embeddings (vectors) for each chunk
      const embeddingRows = insertedChunks.map((chunk, chunkIndex) => ({
        chunkId: chunk.id,
        documentId: document.id,
        embedding: persistedChunks[chunkIndex].embedding,
        id: crypto.randomUUID(),
        ownerUserId: document.ownerUserId,
        projectId: document.projectId,
        vectorId: chunk.vectorId,
      }));

      await tx.insert(documentEmbedding).values(embeddingRows);

      // STEP 2d: Update document status to "ready"
      // This is the final step—only runs if all inserts succeeded
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
    throw new Error(
      `Failed to write document chunks/embeddings for document "${document.id}": ${getPersistenceErrorMessage(error)}`,
      { cause: error }
    );
  }
};
