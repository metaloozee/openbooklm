import { relations } from "drizzle-orm";

import { account, session, user } from "./auth";
import { project } from "./project";

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
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

export const projectRelations = relations(project, ({ one }) => ({
  owner: one(user, {
    fields: [project.ownerUserId],
    references: [user.id],
  }),
}));
