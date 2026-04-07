import "server-only";
import { mistral } from "@ai-sdk/mistral";
import { embed } from "ai";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  documentChunk,
  documentEmbedding,
  projectDocument,
} from "@/lib/db/schema";
import { normalizeText } from "@/lib/utils";

import { DOCUMENT_EMBEDDING_DIMENSIONS } from "./ingestion";

const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 20;

export interface RetrievedDocumentChunk {
  charEnd: number | null;
  charStart: number | null;
  chunkId: string;
  chunkIndex: number;
  content: string;
  documentId: string;
  objectKey: string;
  originalFilename: string;
  similarity: number;
}

const toVectorLiteral = (embedding: number[]): string =>
  `[${embedding.join(",")}]`;

export const searchProjectDocumentChunks = async ({
  documentIds,
  limit = DEFAULT_SEARCH_LIMIT,
  ownerUserId,
  projectId,
  query,
}: {
  documentIds?: string[];
  limit?: number;
  ownerUserId: string;
  projectId: string;
  query: string;
}): Promise<RetrievedDocumentChunk[]> => {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length === 0) {
    return [];
  }

  const { embedding } = await embed({
    model: mistral.embeddingModel("mistral-embed"),
    value: normalizedQuery,
  });

  if (embedding.length !== DOCUMENT_EMBEDDING_DIMENSIONS) {
    throw new Error("Query embedding dimension mismatch");
  }

  const safeLimit = Math.min(Math.max(limit, 1), MAX_SEARCH_LIMIT);
  const queryVector = sql`${toVectorLiteral(embedding)}::vector`;
  const distance = sql<number>`${documentEmbedding.embedding} <=> ${queryVector}`;
  const similarity = sql<number>`1 - (${distance})`;
  const conditions = [
    eq(documentEmbedding.ownerUserId, ownerUserId),
    eq(documentEmbedding.projectId, projectId),
    eq(projectDocument.processingStatus, "ready"),
  ];

  if (documentIds && documentIds.length > 0) {
    conditions.push(inArray(documentEmbedding.documentId, documentIds));
  }

  return db
    .select({
      charEnd: documentChunk.charEnd,
      charStart: documentChunk.charStart,
      chunkId: documentChunk.id,
      chunkIndex: documentChunk.chunkIndex,
      content: documentChunk.text,
      documentId: projectDocument.id,
      objectKey: projectDocument.objectKey,
      originalFilename: projectDocument.originalFilename,
      similarity,
    })
    .from(documentEmbedding)
    .innerJoin(documentChunk, eq(documentEmbedding.chunkId, documentChunk.id))
    .innerJoin(
      projectDocument,
      eq(documentEmbedding.documentId, projectDocument.id)
    )
    .where(and(...conditions))
    .orderBy(distance)
    .limit(safeLimit);
};
