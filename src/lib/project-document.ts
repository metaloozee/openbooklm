import { isDocumentProcessingActive } from "./ingestion";
import type { DocumentProcessingStatus } from "./ingestion";
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
  processingStatus: DocumentProcessingStatus;
  projectId: string;
  sizeBytes: number;
  sourceTextObjectKey: string | null;
  vectorCount: number;
}

export const isActiveDocumentProcessingStatus = (
  status: string | null | undefined
): boolean => isDocumentProcessingActive(status);

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
