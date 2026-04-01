import { relations } from "drizzle-orm";

import { account, session, user } from "./auth";
import { project } from "./project";
import { projectDocument } from "./project-document";

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
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
  documents: many(projectDocument),
  owner: one(user, {
    fields: [project.ownerUserId],
    references: [user.id],
  }),
}));

export const projectDocumentRelations = relations(
  projectDocument,
  ({ one }) => ({
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
