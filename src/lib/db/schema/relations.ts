import { relations } from "drizzle-orm";

import { account, session, user } from "./auth";
import { documentChunk } from "./document-chunk";
import { documentEmbedding } from "./document-embedding";
import { project } from "./project";
import { projectDocument } from "./project-document";

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  documentChunks: many(documentChunk),
  documentEmbeddings: many(documentEmbedding),
  projectDocuments: many(projectDocument),
  projects: many(project),
  sessions: many(session),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const projectRelations = relations(project, ({ many, one }) => ({
  documentChunks: many(documentChunk),
  documentEmbeddings: many(documentEmbedding),
  documents: many(projectDocument),
  owner: one(user, {
    fields: [project.ownerUserId],
    references: [user.id],
  }),
}));

export const projectDocumentRelations = relations(
  projectDocument,
  ({ many, one }) => ({
    chunks: many(documentChunk),
    embeddings: many(documentEmbedding),
    owner: one(user, {
      fields: [projectDocument.ownerUserId],
      references: [user.id],
    }),
    project: one(project, {
      fields: [projectDocument.projectId],
      references: [project.id],
    }),
  })
);

export const documentChunkRelations = relations(documentChunk, ({ one }) => ({
  document: one(projectDocument, {
    fields: [documentChunk.documentId],
    references: [projectDocument.id],
  }),
  embedding: one(documentEmbedding, {
    fields: [documentChunk.id],
    references: [documentEmbedding.chunkId],
  }),
  owner: one(user, {
    fields: [documentChunk.ownerUserId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [documentChunk.projectId],
    references: [project.id],
  }),
}));

export const documentEmbeddingRelations = relations(
  documentEmbedding,
  ({ one }) => ({
    chunk: one(documentChunk, {
      fields: [documentEmbedding.chunkId],
      references: [documentChunk.id],
    }),
    document: one(projectDocument, {
      fields: [documentEmbedding.documentId],
      references: [projectDocument.id],
    }),
    owner: one(user, {
      fields: [documentEmbedding.ownerUserId],
      references: [user.id],
    }),
    project: one(project, {
      fields: [documentEmbedding.projectId],
      references: [project.id],
    }),
  })
);
