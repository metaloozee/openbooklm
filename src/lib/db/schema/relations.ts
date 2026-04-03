import { relations } from "drizzle-orm";

import { account, session, user } from "./auth";
import { documentChunk } from "./document-chunk";
import { project } from "./project";
import { projectDocument } from "./project-document";

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  documentChunks: many(documentChunk),
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
  owner: one(user, {
    fields: [documentChunk.ownerUserId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [documentChunk.projectId],
    references: [project.id],
  }),
}));
