import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { project } from "@/lib/db/schema";

import { createTRPCRouter, protectedProcedure } from "../init";

const projectSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const projectNameSchema = z.string().trim().min(1).max(120);

const projectDescriptionSchema = z.string().trim().max(5000);

const isUniqueProjectSlugError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("UNIQUE constraint failed") ||
    error.message.includes("project_owner_slug_unique")
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

      if (input?.includeArchived) {
        return ctx.db
          .select()
          .from(project)
          .where(eq(project.ownerUserId, ownerUserId))
          .orderBy(desc(project.updatedAt));
      }

      return ctx.db
        .select()
        .from(project)
        .where(
          and(
            eq(project.ownerUserId, ownerUserId),
            eq(project.isArchived, false)
          )
        )
        .orderBy(desc(project.updatedAt));
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
});
