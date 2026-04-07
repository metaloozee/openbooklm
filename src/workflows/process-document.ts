import { mistral } from "@ai-sdk/mistral";
import { Mistral } from "@mistralai/mistralai";
import { MistralError } from "@mistralai/mistralai/models/errors";
import { embedMany } from "ai";
import { FatalError } from "workflow";

import { getDocumentBlob } from "@/lib/documents/blob-storage";
import { isTextDocumentFile } from "@/lib/documents/file-types";
import {
  DOCUMENT_EMBEDDING_DIMENSIONS,
  getOwnedDocument,
  markDocumentAsChunking,
  markDocumentAsEmbedding,
  markDocumentAsFailed,
  markDocumentAsParsing,
  persistDocumentEmbeddings,
} from "@/lib/documents/ingestion";
import { env } from "@/lib/env";
import { normalizeText, generateChunks } from "@/lib/utils";

const EMBEDDING_BATCH_SIZE = 32;
const toErrorMessage = (error: unknown): string => {
  if (error instanceof MistralError) {
    return `Mistral API error occurred: Status ${error.statusCode} Content-Type "${error.headers.get("content-type") ?? "unknown"}". Body: ${error.body}`;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Unknown error";
};

const getDocumentErrorMessage = (error: unknown): string => {
  if (error instanceof FatalError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Failed to process the document";
};

const loadDocument = async ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) => {
  "use step";

  const record = await getOwnedDocument({ documentId, ownerUserId });
  if (!record) {
    throw new FatalError("Document Not Found");
  }

  return record;
};

const markDocumentAsParsingStep = async ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) => {
  "use step";

  try {
    await markDocumentAsParsing({ documentId, ownerUserId });
  } catch {
    throw new FatalError("Failed to mark document as parsing");
  }
};

const markDocumentAsChunkingStep = async ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) => {
  "use step";

  try {
    await markDocumentAsChunking({ documentId, ownerUserId });
  } catch {
    throw new FatalError("Failed to mark document as chunking");
  }
};

const markDocumentAsEmbeddingStep = async ({
  documentId,
  ownerUserId,
}: {
  documentId: string;
  ownerUserId: string;
}) => {
  "use step";

  try {
    await markDocumentAsEmbedding({ documentId, ownerUserId });
  } catch {
    throw new FatalError("Failed to mark document as embedding");
  }
};

const markDocumentAsFailedStep = async ({
  documentId,
  errorMessage,
  ownerUserId,
}: {
  documentId: string;
  errorMessage: string;
  ownerUserId: string;
}) => {
  "use step";

  try {
    await markDocumentAsFailed({
      documentId,
      errorMessage,
      ownerUserId,
    });
  } catch {
    throw new FatalError("Failed to mark document as failed");
  }
};

const loadDocumentContent = async ({
  contentType,
  objectKey,
  originalFilename,
}: {
  contentType: string | null;
  objectKey: string;
  originalFilename: string;
}) => {
  "use step";

  const mistralClient = new Mistral({
    apiKey: env.MISTRAL_API_KEY,
  });

  try {
    const blobResponse = await getDocumentBlob(objectKey);

    if (!blobResponse || blobResponse.statusCode !== 200) {
      throw new FatalError("Document not found");
    }

    const response = new Response(blobResponse.stream);

    if (isTextDocumentFile({ contentType, filename: originalFilename })) {
      return await response.text();
    }

    const result = await mistralClient.ocr.process({
      document: {
        documentUrl: blobResponse.blob.url,
        type: "document_url",
      },
      includeImageBase64: false,
      model: "mistral-ocr-latest",
    });

    if (result.pages.length === 0) {
      throw new FatalError("No pages found in the document");
    }

    return result.pages.map((page) => page.markdown).join("\n\n");
  } catch (error) {
    const reason = toErrorMessage(error);
    throw new FatalError(`Failed to load the document content: ${reason}`);
  }
};

const createDocumentEmbeddings = async ({
  text,
}: {
  text: string;
}): Promise<
  {
    content: string;
    embedding: number[];
  }[]
> => {
  "use step";

  const chunks = generateChunks({ input: text, wordsPerChunk: 256 });
  const embeddingsResult: { embedding: number[]; content: string }[] = [];

  if (chunks.length === 0) {
    throw new FatalError("No chunks generated from document content");
  }

  for (let start = 0; start < chunks.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(start, start + EMBEDDING_BATCH_SIZE);

    const { embeddings } = await embedMany({
      model: mistral.embeddingModel("mistral-embed"),
      values: batch,
    });

    for (let idx = 0; idx < embeddings.length; idx += 1) {
      if (embeddings[idx].length !== DOCUMENT_EMBEDDING_DIMENSIONS) {
        throw new FatalError("Embedding dimension mismatch");
      }

      embeddingsResult.push({
        content: batch[idx],
        embedding: embeddings[idx],
      });
    }
  }

  return embeddingsResult;
};

const persistDocumentEmbeddingsStep = async ({
  document,
  normalizedText,
  persistedChunks,
}: {
  document: Awaited<ReturnType<typeof loadDocument>>;
  normalizedText: string;
  persistedChunks: Awaited<ReturnType<typeof createDocumentEmbeddings>>;
}) => {
  "use step";

  try {
    return await persistDocumentEmbeddings({
      document,
      normalizedText,
      persistedChunks,
    });
  } catch (error) {
    const reason = toErrorMessage(error);
    throw new FatalError(`Failed to persist document embeddings: ${reason}`);
  }
};

export const processDocumentWorkflow = async (input: {
  documentId: string;
  ownerUserId: string;
}) => {
  "use workflow";

  const record = await loadDocument({
    documentId: input.documentId,
    ownerUserId: input.ownerUserId,
  });
  if (record.processingStatus === "ready") {
    return { status: "ready" };
  }

  await markDocumentAsParsingStep({
    documentId: record.id,
    ownerUserId: record.ownerUserId,
  });

  try {
    const raw = await loadDocumentContent({
      contentType: record.contentType,
      objectKey: record.objectKey,
      originalFilename: record.originalFilename,
    });
    const normalized = normalizeText(raw);

    if (!normalized) {
      throw new FatalError("Failed to normalize the document content");
    }

    await markDocumentAsChunkingStep({
      documentId: record.id,
      ownerUserId: record.ownerUserId,
    });

    const embeddings = await createDocumentEmbeddings({ text: normalized });

    await markDocumentAsEmbeddingStep({
      documentId: record.id,
      ownerUserId: record.ownerUserId,
    });

    await persistDocumentEmbeddingsStep({
      document: record,
      normalizedText: normalized,
      persistedChunks: embeddings,
    });

    return {
      chunkCount: embeddings.length,
      status: "ready",
    };
  } catch (error) {
    const errorMessage = getDocumentErrorMessage(error);

    await markDocumentAsFailedStep({
      documentId: record.id,
      errorMessage,
      ownerUserId: record.ownerUserId,
    });

    throw error instanceof FatalError ? error : new FatalError(errorMessage);
  }
};
