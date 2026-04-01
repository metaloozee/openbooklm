CREATE TABLE `project_document` (
	`content_type` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`size_bytes` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_document_owner_created_idx` ON `project_document` (`owner_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `project_document_project_created_idx` ON `project_document` (`project_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_document_object_key_unique` ON `project_document` (`object_key`);