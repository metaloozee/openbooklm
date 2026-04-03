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
    chunkCount: integer("chunk_count").default(0).notNull(),
    contentType: text("content_type"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    ingestionVersion: integer("ingestion_version").default(1).notNull(),
    lastIngestionAttemptAt: integer("last_ingestion_attempt_at", {
      mode: "timestamp_ms",
    }),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    processedAt: integer("processed_at", { mode: "timestamp_ms" }),
    processingError: text("processing_error"),
    processingStartedAt: integer("processing_started_at", {
      mode: "timestamp_ms",
    }),
    processingStatus: text("processing_status").default("ready").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    sizeBytes: integer("size_bytes").notNull(),
    sourceTextObjectKey: text("source_text_object_key"),
    vectorCount: integer("vector_count").default(0).notNull(),
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
    index("project_document_project_status_created_idx").on(
      table.projectId,
      table.processingStatus,
      table.createdAt
    ),
    uniqueIndex("project_document_object_key_unique").on(table.objectKey),
  ]
);
