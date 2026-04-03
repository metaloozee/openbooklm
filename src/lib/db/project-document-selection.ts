import { projectDocument } from "@/lib/db/schema";

export const projectDocumentListSelection = {
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
