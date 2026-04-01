import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import { project } from "./project";

export const projectDocument = sqliteTable(
  "project_document",
  {
    contentType: text("content_type"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    sizeBytes: integer("size_bytes").notNull(),
  },
  (table) => [
    index("project_document_owner_created_idx").on(
      table.ownerUserId,
      table.createdAt
    ),
    index("project_document_project_created_idx").on(
      table.projectId,
      table.createdAt
    ),
    uniqueIndex("project_document_object_key_unique").on(table.objectKey),
  ]
);
