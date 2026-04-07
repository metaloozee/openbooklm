ALTER TABLE "document_chunk" ALTER COLUMN "embedding" SET DATA TYPE vector(1024);--> statement-breakpoint
ALTER TABLE "document_embedding" ALTER COLUMN "embedding" SET DATA TYPE vector(1024);--> statement-breakpoint
ALTER TABLE "project_document" ALTER COLUMN "processing_status" SET DEFAULT 'queued';