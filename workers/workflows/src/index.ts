import { setTimeout as sleep } from "node:timers/promises";

import { Mistral } from "@mistralai/mistralai";
import { WorkflowEntrypoint } from "cloudflare:workers";
import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { documentChunk, projectDocument } from "../../../src/lib/db/schema";
import * as schema from "../../../src/lib/db/schema";
import {
  chunkDocumentText,
  createDocumentVectorId,
  createProcessedTextObjectKey,
  DOCUMENT_EMBEDDING_MODEL,
  DOCUMENT_OCR_MODEL,
  DOCUMENT_PROCESSING_STATUS,
  DOCUMENT_VECTOR_DIMENSION,
  normalizeDocumentText,
} from "../../../src/lib/ingestion";
import type { DocumentIngestionParams } from "../../../src/lib/ingestion";

interface WorkflowWorkerEnv {
  DB: D1Database;
  DOCUMENTS_BUCKET: R2Bucket;
  DOCUMENTS_VECTOR_INDEX: VectorizeIndex;
  MISTRAL_API_KEY: string;
}

interface CurrentDocumentRecord {
  id: string;
  ingestionVersion: number;
}

interface ExtractionStepResult {
  aborted: boolean;
  processedTextObjectKey: string | null;
}

interface ProcessingStepResult {
  aborted: boolean;
  chunkCount: number;
  processedTextObjectKey: string;
  vectorCount: number;
}

const EMBEDDING_BATCH_SIZE = 32;
const CHUNK_INSERT_BATCH_SIZE = 50;
const VECTOR_VISIBILITY_BATCH_SIZE = 100;
const VECTOR_VISIBILITY_ATTEMPTS = 4;
const VECTOR_VISIBILITY_DELAY_MS = 750;
const WORKFLOW_RETRY_CONFIG = {
  retries: {
    backoff: "exponential" as const,
    delay: 10_000,
    limit: 3,
  },
  timeout: 5 * 60 * 1000,
};

const buildDb = (env: WorkflowWorkerEnv) => drizzle(env.DB, { schema });
const wait = (durationMs: number): Promise<void> => sleep(durationMs);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Document ingestion failed.";
};

const isTerminalMistralError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "statusCode" in error &&
  typeof (error as { statusCode: unknown }).statusCode === "number" &&
  (error as { statusCode: number }).statusCode >= 400 &&
  (error as { statusCode: number }).statusCode < 500;

const getCurrentDocument = async (
  db: ReturnType<typeof buildDb>,
  payload: DocumentIngestionParams
): Promise<CurrentDocumentRecord | null> => {
  const [documentRecord] = await db
    .select({
      id: projectDocument.id,
      ingestionVersion: projectDocument.ingestionVersion,
    })
    .from(projectDocument)
    .where(eq(projectDocument.id, payload.documentId))
    .limit(1);

  return documentRecord ?? null;
};

const isCurrentDocument = (
  documentRecord: CurrentDocumentRecord | null,
  payload: DocumentIngestionParams
): documentRecord is CurrentDocumentRecord =>
  Boolean(
    documentRecord &&
    documentRecord.ingestionVersion === payload.ingestionVersion
  );

const deleteVectorsBestEffort = async (
  env: WorkflowWorkerEnv,
  vectorIds: string[]
): Promise<void> => {
  if (vectorIds.length === 0) {
    return;
  }

  try {
    for (
      let index = 0;
      index < vectorIds.length;
      index += VECTOR_VISIBILITY_BATCH_SIZE
    ) {
      await env.DOCUMENTS_VECTOR_INDEX.deleteByIds(
        vectorIds.slice(index, index + VECTOR_VISIBILITY_BATCH_SIZE)
      );
    }
  } catch {
    // Best effort cleanup only.
  }
};

const deleteProcessedTextBestEffort = async (
  env: WorkflowWorkerEnv,
  objectKey: string | null | undefined
): Promise<void> => {
  if (!objectKey) {
    return;
  }

  try {
    await env.DOCUMENTS_BUCKET.delete(objectKey);
  } catch {
    // Best effort cleanup only.
  }
};

const markDocumentFailed = async (
  db: ReturnType<typeof buildDb>,
  payload: DocumentIngestionParams,
  errorMessage: string
): Promise<void> => {
  await db
    .update(projectDocument)
    .set({
      lastIngestionAttemptAt: new Date(),
      processedAt: new Date(),
      processingError: errorMessage.slice(0, 500),
      processingStatus: DOCUMENT_PROCESSING_STATUS.FAILED,
    })
    .where(
      and(
        eq(projectDocument.id, payload.documentId),
        eq(projectDocument.ingestionVersion, payload.ingestionVersion)
      )
    );
};

const verifyVectorsVisible = async (
  env: WorkflowWorkerEnv,
  vectorIds: string[]
): Promise<void> => {
  if (vectorIds.length === 0) {
    return;
  }

  for (let attempt = 0; attempt < VECTOR_VISIBILITY_ATTEMPTS; attempt += 1) {
    let allVisible = true;

    for (
      let index = 0;
      index < vectorIds.length;
      index += VECTOR_VISIBILITY_BATCH_SIZE
    ) {
      const batch = vectorIds.slice(
        index,
        index + VECTOR_VISIBILITY_BATCH_SIZE
      );
      const vectors = await env.DOCUMENTS_VECTOR_INDEX.getByIds(batch);

      if (vectors.length !== batch.length) {
        allVisible = false;
        break;
      }
    }

    if (allVisible) {
      return;
    }

    await wait(VECTOR_VISIBILITY_DELAY_MS);
  }

  throw new Error(
    "Timed out while waiting for Vectorize upserts to become visible."
  );
};

const extractDocumentText = async (
  env: WorkflowWorkerEnv,
  payload: DocumentIngestionParams
): Promise<string> => {
  const object = await env.DOCUMENTS_BUCKET.get(payload.objectKey);

  if (!object) {
    throw new NonRetryableError("Uploaded document was not found in storage.");
  }

  const normalizedFilename = payload.originalFilename.toLowerCase();

  if (
    normalizedFilename.endsWith(".md") ||
    normalizedFilename.endsWith(".txt") ||
    payload.contentType === "text/markdown" ||
    payload.contentType?.startsWith("text/plain")
  ) {
    return normalizeDocumentText(await object.text());
  }

  const mistral = new Mistral({
    apiKey: env.MISTRAL_API_KEY,
  });

  const uploadedFile = await mistral.files.upload({
    file: {
      content: await object.arrayBuffer(),
      fileName: payload.originalFilename,
    },
    purpose: "ocr",
  });

  try {
    const response = await mistral.ocr.process({
      document: {
        fileId: uploadedFile.id,
        type: "file",
      },
      includeImageBase64: false,
      model: DOCUMENT_OCR_MODEL,
      tableFormat: "markdown",
    });

    return normalizeDocumentText(
      response.pages
        .map((page) => page.markdown)
        .filter((pageMarkdown) => pageMarkdown.length > 0)
        .join("\n\n")
    );
  } catch (error) {
    if (isTerminalMistralError(error)) {
      throw new NonRetryableError(getErrorMessage(error));
    }

    throw error;
  } finally {
    try {
      await mistral.files.delete({
        fileId: uploadedFile.id,
      });
    } catch {
      // Best effort cleanup only.
    }
  }
};

const createChunkEmbeddings = async (
  env: WorkflowWorkerEnv,
  chunks: { text: string }[]
): Promise<number[][]> => {
  const mistral = new Mistral({
    apiKey: env.MISTRAL_API_KEY,
  });
  const embeddings: number[][] = [];

  for (let index = 0; index < chunks.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(index, index + EMBEDDING_BATCH_SIZE);
    const response = await mistral.embeddings.create({
      inputs: batch.map((chunk) => chunk.text),
      model: DOCUMENT_EMBEDDING_MODEL,
      outputDimension: DOCUMENT_VECTOR_DIMENSION,
    });

    const orderedEmbeddings = [...response.data]
      .toSorted((left, right) => (left.index ?? 0) - (right.index ?? 0))
      .map((item) => item.embedding ?? []);

    embeddings.push(...orderedEmbeddings);
  }

  return embeddings;
};

export class DocumentIngestionWorkflow extends WorkflowEntrypoint<
  WorkflowWorkerEnv,
  DocumentIngestionParams
> {
  public override async run(
    event: Readonly<WorkflowEvent<DocumentIngestionParams>>,
    step: WorkflowStep
  ): Promise<{ status: "aborted" | "failed" | "ready" }> {
    const { payload } = event;
    const db = buildDb(this.env);

    if (!isCurrentDocument(await getCurrentDocument(db, payload), payload)) {
      return { status: "aborted" };
    }

    try {
      await step.do("mark-parsing", async () => {
        if (
          !isCurrentDocument(await getCurrentDocument(db, payload), payload)
        ) {
          return { aborted: true };
        }

        await db
          .update(projectDocument)
          .set({
            lastIngestionAttemptAt: new Date(),
            processingError: null,
            processingStartedAt: new Date(),
            processingStatus: DOCUMENT_PROCESSING_STATUS.PARSING,
          })
          .where(
            and(
              eq(projectDocument.id, payload.documentId),
              eq(projectDocument.ingestionVersion, payload.ingestionVersion)
            )
          );

        return { aborted: false };
      });

      const extractionResult = await step.do<ExtractionStepResult>(
        "extract-and-store-text",
        WORKFLOW_RETRY_CONFIG,
        async () => {
          if (
            !isCurrentDocument(await getCurrentDocument(db, payload), payload)
          ) {
            return {
              aborted: true,
              processedTextObjectKey: null,
            };
          }

          const extractedText = await extractDocumentText(this.env, payload);

          if (extractedText.length === 0) {
            throw new NonRetryableError(
              "No readable content could be extracted from this document."
            );
          }

          const processedTextObjectKey = createProcessedTextObjectKey(
            payload.documentId,
            payload.originalFilename
          );

          await this.env.DOCUMENTS_BUCKET.put(
            processedTextObjectKey,
            extractedText,
            {
              httpMetadata: {
                contentType: "text/markdown; charset=utf-8",
              },
            }
          );

          if (
            !isCurrentDocument(await getCurrentDocument(db, payload), payload)
          ) {
            await deleteProcessedTextBestEffort(
              this.env,
              processedTextObjectKey
            );
            return {
              aborted: true,
              processedTextObjectKey: null,
            };
          }

          return {
            aborted: false,
            processedTextObjectKey,
          };
        }
      );

      const { aborted: extractionAborted, processedTextObjectKey } =
        extractionResult;

      if (extractionAborted || !processedTextObjectKey) {
        return { status: "aborted" };
      }

      const currentProcessedTextObjectKey = processedTextObjectKey;

      const processingResult = await step.do<ProcessingStepResult>(
        "process-document",
        WORKFLOW_RETRY_CONFIG,
        async () => {
          if (
            !isCurrentDocument(await getCurrentDocument(db, payload), payload)
          ) {
            return {
              aborted: true,
              chunkCount: 0,
              processedTextObjectKey: currentProcessedTextObjectKey,
              vectorCount: 0,
            };
          }

          await db
            .update(projectDocument)
            .set({
              processingStatus: DOCUMENT_PROCESSING_STATUS.CHUNKING,
              sourceTextObjectKey: currentProcessedTextObjectKey,
            })
            .where(
              and(
                eq(projectDocument.id, payload.documentId),
                eq(projectDocument.ingestionVersion, payload.ingestionVersion)
              )
            );

          const processedTextObject = await this.env.DOCUMENTS_BUCKET.get(
            currentProcessedTextObjectKey
          );

          if (!processedTextObject) {
            throw new NonRetryableError(
              "Processed text was not found in storage."
            );
          }

          const chunks = chunkDocumentText(await processedTextObject.text());

          if (chunks.length === 0) {
            throw new NonRetryableError(
              "No searchable chunks could be created from this document."
            );
          }

          await db
            .update(projectDocument)
            .set({
              processingStatus: DOCUMENT_PROCESSING_STATUS.EMBEDDING,
              sourceTextObjectKey: currentProcessedTextObjectKey,
            })
            .where(
              and(
                eq(projectDocument.id, payload.documentId),
                eq(projectDocument.ingestionVersion, payload.ingestionVersion)
              )
            );

          const embeddings = await createChunkEmbeddings(this.env, chunks);

          if (embeddings.length !== chunks.length) {
            throw new Error(
              "Embedding response size did not match chunk count."
            );
          }

          const createdVectorIds: string[] = [];

          try {
            const vectors = chunks.map((chunk, chunkIndex) => {
              const vectorId = createDocumentVectorId(
                payload.documentId,
                chunk.chunkIndex
              );
              createdVectorIds.push(vectorId);

              return {
                id: vectorId,
                metadata: {
                  chunkIndex: chunk.chunkIndex,
                  documentId: payload.documentId,
                  ownerUserId: payload.ownerUserId,
                  projectId: payload.projectId,
                },
                values: embeddings[chunkIndex] ?? [],
              };
            });

            for (
              let index = 0;
              index < vectors.length;
              index += EMBEDDING_BATCH_SIZE
            ) {
              await this.env.DOCUMENTS_VECTOR_INDEX.upsert(
                vectors.slice(index, index + EMBEDDING_BATCH_SIZE)
              );
            }

            await verifyVectorsVisible(this.env, createdVectorIds);

            if (
              !isCurrentDocument(await getCurrentDocument(db, payload), payload)
            ) {
              await deleteVectorsBestEffort(this.env, createdVectorIds);
              await deleteProcessedTextBestEffort(
                this.env,
                processedTextObjectKey
              );

              return {
                aborted: true,
                chunkCount: 0,
                processedTextObjectKey: currentProcessedTextObjectKey,
                vectorCount: 0,
              };
            }

            await db
              .delete(documentChunk)
              .where(eq(documentChunk.documentId, payload.documentId));

            for (
              let index = 0;
              index < chunks.length;
              index += CHUNK_INSERT_BATCH_SIZE
            ) {
              const chunkBatch = chunks.slice(
                index,
                index + CHUNK_INSERT_BATCH_SIZE
              );

              await db.insert(documentChunk).values(
                chunkBatch.map((chunk) => ({
                  charEnd: chunk.charEnd,
                  charStart: chunk.charStart,
                  chunkIndex: chunk.chunkIndex,
                  documentId: payload.documentId,
                  id: crypto.randomUUID(),
                  ownerUserId: payload.ownerUserId,
                  projectId: payload.projectId,
                  text: chunk.text,
                  vectorId: createDocumentVectorId(
                    payload.documentId,
                    chunk.chunkIndex
                  ),
                }))
              );
            }

            return {
              aborted: false,
              chunkCount: chunks.length,
              processedTextObjectKey: currentProcessedTextObjectKey,
              vectorCount: createdVectorIds.length,
            };
          } catch (error) {
            await deleteVectorsBestEffort(this.env, createdVectorIds);
            throw error;
          }
        }
      );

      if (processingResult.aborted) {
        return { status: "aborted" };
      }

      await step.do("mark-ready", async () => {
        if (
          !isCurrentDocument(await getCurrentDocument(db, payload), payload)
        ) {
          return { aborted: true };
        }

        await db
          .update(projectDocument)
          .set({
            chunkCount: processingResult.chunkCount,
            processedAt: new Date(),
            processingError: null,
            processingStatus: DOCUMENT_PROCESSING_STATUS.READY,
            sourceTextObjectKey: processingResult.processedTextObjectKey,
            vectorCount: processingResult.vectorCount,
          })
          .where(
            and(
              eq(projectDocument.id, payload.documentId),
              eq(projectDocument.ingestionVersion, payload.ingestionVersion)
            )
          );

        return { aborted: false };
      });

      return { status: "ready" };
    } catch (error) {
      if (isCurrentDocument(await getCurrentDocument(db, payload), payload)) {
        await step.do("mark-failed", async () => {
          await markDocumentFailed(db, payload, getErrorMessage(error));
          return { ok: true };
        });
      }

      throw error;
    }
  }
}

const worker: ExportedHandler<WorkflowWorkerEnv> = {
  fetch(): Response {
    return new Response("Document workflow worker is healthy.");
  },
};

export default worker;
