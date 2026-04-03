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
import { projectDocument } from "./project-document";

export const documentChunk = sqliteTable(
  "document_chunk",
  {
    charEnd: integer("char_end"),
    charStart: integer("char_start"),
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    documentId: text("document_id")
      .notNull()
      .references(() => projectDocument.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    vectorId: text("vector_id").notNull(),
  },
  (table) => [
    uniqueIndex("document_chunk_document_chunk_unique").on(
      table.documentId,
      table.chunkIndex
    ),
    uniqueIndex("document_chunk_vector_id_unique").on(table.vectorId),
    index("document_chunk_project_created_idx").on(
      table.projectId,
      table.createdAt
    ),
    index("document_chunk_owner_created_idx").on(
      table.ownerUserId,
      table.createdAt
    ),
  ]
);
