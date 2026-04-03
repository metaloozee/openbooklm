CREATE TABLE `document_chunk` (
	`char_end` integer,
	`char_start` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`document_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`text` text NOT NULL,
	`vector_id` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `project_document`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_chunk_document_chunk_unique` ON `document_chunk` (`document_id`,`chunk_index`);--> statement-breakpoint
CREATE UNIQUE INDEX `document_chunk_vector_id_unique` ON `document_chunk` (`vector_id`);--> statement-breakpoint
CREATE INDEX `document_chunk_project_created_idx` ON `document_chunk` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `document_chunk_owner_created_idx` ON `document_chunk` (`owner_user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `project_document` ADD `chunk_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_document` ADD `ingestion_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_document` ADD `last_ingestion_attempt_at` integer;--> statement-breakpoint
ALTER TABLE `project_document` ADD `processed_at` integer;--> statement-breakpoint
ALTER TABLE `project_document` ADD `processing_error` text;--> statement-breakpoint
ALTER TABLE `project_document` ADD `processing_started_at` integer;--> statement-breakpoint
ALTER TABLE `project_document` ADD `processing_status` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_document` ADD `source_text_object_key` text;--> statement-breakpoint
ALTER TABLE `project_document` ADD `vector_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `project_document_project_status_created_idx` ON `project_document` (`project_id`,`processing_status`,`created_at`);