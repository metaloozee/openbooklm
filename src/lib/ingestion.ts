const documentProcessingStatusValues = [
  "queued",
  "parsing",
  "chunking",
  "embedding",
  "ready",
  "failed",
] as const;

export type DocumentProcessingStatus =
  (typeof documentProcessingStatusValues)[number];

export const DOCUMENT_PROCESSING_STATUS = Object.freeze({
  CHUNKING: "chunking" as const,
  EMBEDDING: "embedding" as const,
  FAILED: "failed" as const,
  PARSING: "parsing" as const,
  QUEUED: "queued" as const,
  READY: "ready" as const,
});

export const ACTIVE_DOCUMENT_PROCESSING_STATUSES =
  new Set<DocumentProcessingStatus>([
    DOCUMENT_PROCESSING_STATUS.QUEUED,
    DOCUMENT_PROCESSING_STATUS.PARSING,
    DOCUMENT_PROCESSING_STATUS.CHUNKING,
    DOCUMENT_PROCESSING_STATUS.EMBEDDING,
  ]);

export const DOCUMENT_EMBEDDING_MODEL = "mistral-embed";
export const DOCUMENT_OCR_MODEL = "mistral-ocr-latest";
export const DOCUMENT_VECTOR_DIMENSION = 1024;

const DOCUMENT_CHUNK_TARGET_LENGTH = 1200;
const DOCUMENT_CHUNK_OVERLAP = 200;
const repeatedNewlinePattern = /\n{3,}/g;
const whitespacePattern = /\s+/g;

export interface DocumentIngestionParams {
  contentType: string | null;
  documentId: string;
  ingestionVersion: number;
  objectKey: string;
  originalFilename: string;
  ownerUserId: string;
  projectId: string;
}

export type DocumentIngestionMessage = DocumentIngestionParams;

export interface DocumentTextChunk {
  charEnd: number;
  charStart: number;
  chunkIndex: number;
  text: string;
}

export const isDocumentProcessingActive = (
  status: string | null | undefined
): status is DocumentProcessingStatus =>
  status !== undefined &&
  status !== null &&
  ACTIVE_DOCUMENT_PROCESSING_STATUSES.has(status as DocumentProcessingStatus);

export const normalizeDocumentText = (value: string): string =>
  value
    .replaceAll(/\r\n?/g, "\n")
    .replaceAll(repeatedNewlinePattern, "\n\n")
    .trim();

const findChunkBoundary = (value: string, targetIndex: number): number => {
  if (targetIndex >= value.length) {
    return value.length;
  }

  const punctuationBoundary = Math.max(
    value.lastIndexOf("\n\n", targetIndex),
    value.lastIndexOf(". ", targetIndex),
    value.lastIndexOf("! ", targetIndex),
    value.lastIndexOf("? ", targetIndex)
  );

  if (punctuationBoundary > 0) {
    return punctuationBoundary + 1;
  }

  const whitespaceBoundary = value.lastIndexOf(" ", targetIndex);
  if (whitespaceBoundary > 0) {
    return whitespaceBoundary;
  }

  return Math.min(targetIndex, value.length);
};

export const chunkDocumentText = (input: string): DocumentTextChunk[] => {
  const text = normalizeDocumentText(input);

  if (text.length === 0) {
    return [];
  }

  const chunks: DocumentTextChunk[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const rawEndIndex = Math.min(
      startIndex + DOCUMENT_CHUNK_TARGET_LENGTH,
      text.length
    );
    const endIndex = findChunkBoundary(text, rawEndIndex);
    const chunkText = text.slice(startIndex, endIndex).trim();

    if (chunkText.length > 0) {
      const trimmedStartOffset = text
        .slice(startIndex, endIndex)
        .search(/\S|$/u);
      const chunkStart = startIndex + Math.max(trimmedStartOffset, 0);
      const chunkEnd = chunkStart + chunkText.length;

      chunks.push({
        charEnd: chunkEnd,
        charStart: chunkStart,
        chunkIndex: chunks.length,
        text: chunkText,
      });
    }

    if (endIndex >= text.length) {
      break;
    }

    startIndex = Math.max(endIndex - DOCUMENT_CHUNK_OVERLAP, startIndex + 1);
  }

  return chunks;
};

export const createDocumentVectorId = (
  documentId: string,
  chunkIndex: number
): string => `${documentId}:${chunkIndex}`;

export const createDocumentWorkflowInstanceId = (
  documentId: string,
  ingestionVersion: number
): string => `${documentId}:${ingestionVersion}`;

export const createProcessedTextObjectKey = (
  documentId: string,
  originalFilename: string
): string => {
  const normalizedFilename = originalFilename
    .trim()
    .toLowerCase()
    .replaceAll(whitespacePattern, "-")
    .replaceAll(/[^a-z0-9.-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return `processed/${documentId}/${normalizedFilename || "document"}.md`;
};

export const getDocumentProcessingStatusValues =
  (): readonly DocumentProcessingStatus[] => documentProcessingStatusValues;
