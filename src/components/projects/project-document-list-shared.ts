import { ACTIVE_DOCUMENT_PROCESSING_STATUSES } from "@/lib/documents/status";
import type { DocumentProcessingStatus as ProjectDocumentProcessingStatus } from "@/lib/documents/status";

export const documentListPollIntervalMs = 2000;

export interface ProjectDocumentListItem {
  chunkCount: number;
  contentType: string | null;
  createdAt: Date;
  id: string;
  ingestionVersion: number;
  lastIngestionAttemptAt: Date | null;
  objectKey: string;
  originalFilename: string;
  processedAt: Date | null;
  processingError: string | null;
  processingStartedAt: Date | null;
  processingStatus: ProjectDocumentProcessingStatus;
  projectId: string;
  sizeBytes: number;
  sourceTextObjectKey: string | null;
  vectorCount: number;
}

export const isActiveDocumentProcessingStatus = (
  status: string | null | undefined
): boolean =>
  status !== undefined &&
  status !== null &&
  ACTIVE_DOCUMENT_PROCESSING_STATUSES.has(
    status as ProjectDocumentProcessingStatus
  );

export const mergeProjectDocumentList = (
  currentDocuments: ProjectDocumentListItem[] | undefined,
  nextDocuments: ProjectDocumentListItem[]
): ProjectDocumentListItem[] => {
  const documentsById = new Map<string, ProjectDocumentListItem>();

  for (const document of currentDocuments ?? []) {
    documentsById.set(document.id, document);
  }

  for (const document of nextDocuments) {
    documentsById.set(document.id, document);
  }

  return [...documentsById.values()].toSorted(
    (leftDocument, rightDocument) =>
      rightDocument.createdAt.getTime() - leftDocument.createdAt.getTime()
  );
};
