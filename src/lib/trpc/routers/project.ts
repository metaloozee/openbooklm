import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { buildGroundedAnswerContext } from "@/lib/ai/build-grounded-answer-context";
import { project, projectDocument } from "@/lib/db/schema";
import { getOwnedProject } from "@/lib/documents/ingestion";
import { searchProjectDocumentChunks } from "@/lib/documents/retrieval";
import { getUserPersonalization } from "@/lib/settings/get-user-personalization";

import { createTRPCRouter, protectedProcedure } from "../init";

const projectSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const projectNameSchema = z.string().trim().min(1).max(120);
const projectDocumentNameSchema = z.string().trim().min(1).max(255);

const projectDescriptionSchema = z.string().trim().max(5000);
const projectSearchQuerySchema = z.string().trim().min(1).max(5000);

const isUniqueProjectSlugError = (error: unknown): boolean => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const { message } = error;

  return (
    message.includes("UNIQUE constraint failed") ||
    message.includes("duplicate key value violates unique constraint") ||
    message.includes("project_owner_slug_unique")
  );
};

export const projectRouter = createTRPCRouter({
  archiveProject: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const [archivedProject] = await ctx.db
        .update(project)
        .set({
          isArchived: true,
        })
        .where(
          and(eq(project.id, input.id), eq(project.ownerUserId, ownerUserId))
        )
        .returning();

      if (!archivedProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return archivedProject;
    }),

  createProject: protectedProcedure
    .input(
      z.object({
        description: projectDescriptionSchema.optional(),
        name: projectNameSchema,
        slug: projectSlugSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      try {
        const [createdProject] = await ctx.db
          .insert(project)
          .values({
            description: input.description,
            id: crypto.randomUUID(),
            name: input.name,
            ownerUserId,
            slug: input.slug,
          })
          .returning();

        if (!createdProject) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create project",
          });
        }

        return createdProject;
      } catch (error) {
        if (isUniqueProjectSlugError(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A project with this slug already exists",
          });
        }

        throw error;
      }
    }),
  deleteProjectDocument: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const [deletedDocument] = await ctx.db
        .delete(projectDocument)
        .where(
          and(
            eq(projectDocument.id, input.id),
            eq(projectDocument.ownerUserId, ownerUserId)
          )
        )
        .returning({
          id: projectDocument.id,
          objectKey: projectDocument.objectKey,
        });

      if (!deletedDocument) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      try {
        await del(deletedDocument.objectKey);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to clean up blob",
        });
      }

      return deletedDocument;
    }),

  getDocumentById: protectedProcedure
    .input(
      z.object({
        documentId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const [foundDocument] = await ctx.db
        .select()
        .from(projectDocument)
        .where(
          and(
            eq(projectDocument.id, input.documentId),
            eq(projectDocument.ownerUserId, ownerUserId)
          )
        )
        .limit(1);

      if (!foundDocument) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      return foundDocument;
    }),
  getProjectById: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const [foundProject] = await ctx.db
        .select()
        .from(project)
        .where(
          and(eq(project.id, input.id), eq(project.ownerUserId, ownerUserId))
        )
        .limit(1);

      if (!foundProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return foundProject;
    }),

  getProjectBySlug: protectedProcedure
    .input(
      z.object({
        slug: projectSlugSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const [foundProject] = await ctx.db
        .select()
        .from(project)
        .where(
          and(
            eq(project.ownerUserId, ownerUserId),
            eq(project.slug, input.slug)
          )
        )
        .limit(1);

      if (!foundProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return foundProject;
    }),

  listProjectDocuments: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const rows = await ctx.db
        .select({ document: projectDocument })
        .from(project)
        .leftJoin(
          projectDocument,
          and(
            eq(projectDocument.projectId, project.id),
            eq(projectDocument.ownerUserId, ownerUserId)
          )
        )
        .where(
          and(
            eq(project.id, input.projectId),
            eq(project.ownerUserId, ownerUserId)
          )
        )
        .orderBy(desc(projectDocument.createdAt));

      if (rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return rows
        .map((row) => row.document)
        .filter(
          (doc): doc is typeof projectDocument.$inferSelect =>
            doc !== null && doc.id !== null
        );
    }),

  listProjects: protectedProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const conditions = [eq(project.ownerUserId, ownerUserId)];

      if (!input?.includeArchived) {
        conditions.push(eq(project.isArchived, false));
      }

      return ctx.db
        .select()
        .from(project)
        .where(and(...conditions))
        .orderBy(desc(project.updatedAt));
    }),
  prepareGroundedAnswerContext: protectedProcedure
    .input(
      z.object({
        documentIds: z.array(z.string().min(1)).max(25).optional(),
        limit: z.number().int().min(1).max(20).optional(),
        projectId: z.string().min(1),
        query: projectSearchQuerySchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;
      const foundProject = await getOwnedProject({
        ownerUserId,
        projectId: input.projectId,
      });

      if (!foundProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const [personalization, retrievedChunks] = await Promise.all([
        getUserPersonalization({ userId: ownerUserId }),
        searchProjectDocumentChunks({
          documentIds: input.documentIds,
          limit: input.limit,
          ownerUserId,
          projectId: input.projectId,
          query: input.query,
        }),
      ]);

      return {
        personalization,
        promptContext: buildGroundedAnswerContext({
          personalization,
          retrievedChunks,
          userQuestion: input.query,
        }),
        retrievedChunks,
      };
    }),
  searchProjectDocuments: protectedProcedure
    .input(
      z.object({
        documentIds: z.array(z.string().min(1)).max(25).optional(),
        limit: z.number().int().min(1).max(20).optional(),
        projectId: z.string().min(1),
        query: projectSearchQuerySchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;
      const foundProject = await getOwnedProject({
        ownerUserId,
        projectId: input.projectId,
      });

      if (!foundProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return searchProjectDocumentChunks({
        documentIds: input.documentIds,
        limit: input.limit,
        ownerUserId,
        projectId: input.projectId,
        query: input.query,
      });
    }),

  updateProject: protectedProcedure
    .input(
      z
        .object({
          description: projectDescriptionSchema.nullable().optional(),
          id: z.string().min(1),
          name: projectNameSchema.optional(),
          slug: projectSlugSchema.optional(),
        })
        .refine(
          (value) =>
            value.name !== undefined ||
            value.slug !== undefined ||
            value.description !== undefined,
          {
            message:
              "At least one field must be provided for update (name, slug, or description)",
          }
        )
    )
    .mutation(async ({ ctx, input }) => {
      const ownerUserId = ctx.session.user.id;

      const updates: {
        description?: string | null;
        name?: string;
        slug?: string;
      } = {};

      if (input.description !== undefined) {
        updates.description = input.description;
      }

      if (input.name !== undefined) {
        updates.name = input.name;
      }

      if (input.slug !== undefined) {
        updates.slug = input.slug;
      }

      try {
        const [updatedProject] = await ctx.db
          .update(project)
          .set(updates)
          .where(
            and(eq(project.id, input.id), eq(project.ownerUserId, ownerUserId))
          )
          .returning();

        if (!updatedProject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        return updatedProject;
      } catch (error) {
        if (isUniqueProjectSlugError(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A project with this slug already exists",
          });
        }

        throw error;
      }
    }),

  updateProjectDocument: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        originalFilename: projectDocumentNameSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedDocument] = await ctx.db
        .update(projectDocument)
        .set({
          originalFilename: input.originalFilename,
        })
        .where(
          and(
            eq(projectDocument.id, input.id),
            eq(projectDocument.ownerUserId, ctx.session.user.id)
          )
        )
        .returning({
          id: projectDocument.id,
          originalFilename: projectDocument.originalFilename,
        });

      if (!updatedDocument) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      return updatedDocument;
    }),
});
