export const DOCUMENT_PROCESSING_STATUSES = [
  "queued",
  "parsing",
  "chunking",
  "embedding",
  "ready",
  "failed",
] as const;

export type DocumentProcessingStatus =
  (typeof DOCUMENT_PROCESSING_STATUSES)[number];

export const ACTIVE_DOCUMENT_PROCESSING_STATUSES = new Set([
  "queued",
  "parsing",
  "chunking",
  "embedding",
]);

export const isDocumentProcessingStatus = (
  status: string | null | undefined
): status is DocumentProcessingStatus =>
  status !== undefined &&
  status !== null &&
  DOCUMENT_PROCESSING_STATUSES.includes(status as DocumentProcessingStatus);
