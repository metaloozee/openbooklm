CREATE TABLE `project` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`description` text,
	`id` text PRIMARY KEY NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`slug` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_owner_slug_unique` ON `project` (`owner_user_id`,`slug`);--> statement-breakpoint
CREATE INDEX `project_owner_updated_idx` ON `project` (`owner_user_id`,`updated_at`);