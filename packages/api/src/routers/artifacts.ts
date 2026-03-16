import { artifact, artifactSource, project, source } from "@openbooklm/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { artifactActionSchema, artifactCreateSchema, projectIdSchema } from "../contracts";
import { protectedProcedure, router } from "../index";
import { getProjectForUserOrThrow } from "../project-access";

function toIsoString(value: Date) {
	return value.toISOString();
}

export const artifactsRouter = router({
	list: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const records = await ctx.db.query.artifact.findMany({
			where: eq(artifact.projectId, input.projectId),
			with: {
				sourceLinks: {
					with: {
						source: true,
					},
				},
			},
			orderBy: [desc(artifact.updatedAt)],
		});

		return records.map((item) => ({
			id: item.id,
			projectId: item.projectId,
			title: item.title,
			type: item.type,
			contentPreview:
				item.content.length > 180 ? `${item.content.slice(0, 177)}...` : item.content,
			sourceIds: item.sourceLinks.map((link) => link.sourceId),
			sourceTitles: item.sourceLinks.map((link) => link.source.title),
			createdAt: toIsoString(item.createdAt),
			updatedAt: toIsoString(item.updatedAt),
		}));
	}),
	create: protectedProcedure.input(artifactCreateSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		if (input.sourceIds.length > 0) {
			const availableSources = await ctx.db.query.source.findMany({
				where: and(
					eq(source.projectId, input.projectId),
					inArray(source.id, input.sourceIds),
				),
				columns: {
					id: true,
				},
			});

			if (availableSources.length !== input.sourceIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Selected sources must belong to the current project",
				});
			}
		}

		const artifactId = crypto.randomUUID();
		const timestamp = new Date();
		await ctx.db.batch([
			ctx.db.insert(artifact).values({
				id: artifactId,
				projectId: input.projectId,
				createdByUserId: ctx.userId,
				title: input.title,
				type: input.type,
				content: input.content,
				createdAt: timestamp,
				updatedAt: timestamp,
			}),
			...(input.sourceIds.length > 0
				? [
						ctx.db.insert(artifactSource).values(
							input.sourceIds.map((sourceId) => ({
								artifactId,
								sourceId,
							})),
						),
					]
				: []),
			ctx.db
				.update(project)
				.set({
					updatedAt: timestamp,
				})
				.where(eq(project.id, input.projectId)),
		]);

		return { id: artifactId };
	}),
	delete: protectedProcedure.input(artifactActionSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const currentArtifact = await ctx.db.query.artifact.findFirst({
			where: and(eq(artifact.id, input.artifactId), eq(artifact.projectId, input.projectId)),
			columns: {
				id: true,
			},
		});

		if (!currentArtifact) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Artifact not found",
			});
		}

		const timestamp = new Date();
		await ctx.db.batch([
			ctx.db.delete(artifactSource).where(eq(artifactSource.artifactId, input.artifactId)),
			ctx.db.delete(artifact).where(eq(artifact.id, input.artifactId)),
			ctx.db
				.update(project)
				.set({
					updatedAt: timestamp,
				})
				.where(eq(project.id, input.projectId)),
		]);

		return { id: input.artifactId };
	}),
});
