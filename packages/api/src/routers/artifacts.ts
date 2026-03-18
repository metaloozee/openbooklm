import { artifact, artifactSource, source } from "@openbooklm/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import {
	artifactActionSchema,
	artifactCreateSchema,
	artifactUpdateSchema,
	projectIdSchema,
} from "../contracts";
import { protectedProcedure, router } from "../index";
import { getProjectForUserOrThrow, touchProject } from "../project-access";

function toIsoString(value: Date) {
	return value.toISOString();
}

const ARTIFACT_CONTENT_PLACEHOLDER =
	"Artifact generation pending. AI generation is not implemented yet.";

function getContentPreview(content: string) {
	return content.length > 180 ? `${content.slice(0, 177)}...` : content;
}

async function assertArtifactBelongsToProject(
	ctx: Pick<Context, "db">,
	input: { projectId: string; artifactId: string },
) {
	const currentArtifact = await ctx.db.query.artifact.findFirst({
		where: and(eq(artifact.id, input.artifactId), eq(artifact.projectId, input.projectId)),
		with: {
			sourceLinks: {
				with: {
					source: true,
				},
			},
		},
	});

	if (!currentArtifact) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Artifact not found",
		});
	}

	return currentArtifact;
}

async function assertArtifactExists(
	ctx: Pick<Context, "db">,
	input: { projectId: string; artifactId: string },
) {
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

	return currentArtifact;
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
			contentPreview: getContentPreview(item.content),
			sourceIds: item.sourceLinks.map((link) => link.sourceId),
			sourceTitles: item.sourceLinks.map((link) => link.source.title),
			createdAt: toIsoString(item.createdAt),
			updatedAt: toIsoString(item.updatedAt),
		}));
	}),
	byId: protectedProcedure.input(artifactActionSchema).query(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);
		const item = await assertArtifactBelongsToProject(ctx, input);

		return {
			id: item.id,
			projectId: item.projectId,
			title: item.title,
			type: item.type,
			content: item.content,
			contentJson: item.contentJson,
			contentPreview: getContentPreview(item.content),
			sourceIds: item.sourceLinks.map(
				(link: (typeof item.sourceLinks)[number]) => link.sourceId,
			),
			sourceTitles: item.sourceLinks.map(
				(link: (typeof item.sourceLinks)[number]) => link.source.title,
			),
			createdAt: toIsoString(item.createdAt),
			updatedAt: toIsoString(item.updatedAt),
		};
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

		// TODO: Replace placeholder content with AI-generated artifact output using
		// input.type, input.sourceIds, and optional input.instructions.
		await ctx.db.batch([
			ctx.db.insert(artifact).values({
				id: artifactId,
				projectId: input.projectId,
				createdByUserId: ctx.userId,
				title: input.title,
				type: input.type,
				instructions: input.instructions?.trim() || null,
				content: ARTIFACT_CONTENT_PLACEHOLDER,
				contentJson: null,
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
		]);

		await touchProject(ctx.db, input.projectId);

		return { id: artifactId };
	}),
	update: protectedProcedure.input(artifactUpdateSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);
		await assertArtifactExists(ctx, input);

		const [updatedArtifact] = await ctx.db
			.update(artifact)
			.set({
				title: input.title,
				content: input.content,
				contentJson: input.contentJson,
				updatedAt: new Date(),
			})
			.where(and(eq(artifact.id, input.artifactId), eq(artifact.projectId, input.projectId)))
			.returning({
				id: artifact.id,
				updatedAt: artifact.updatedAt,
			});

		if (!updatedArtifact) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Artifact not found",
			});
		}

		await touchProject(ctx.db, input.projectId);

		return {
			id: updatedArtifact.id,
			updatedAt: toIsoString(updatedArtifact.updatedAt),
		};
	}),
	uploadImage: protectedProcedure.input(artifactActionSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);
		await assertArtifactExists(ctx, input);

		throw new TRPCError({
			code: "NOT_IMPLEMENTED",
			message: "Artifact image upload is not implemented yet.",
		});
	}),
	delete: protectedProcedure.input(artifactActionSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);
		await assertArtifactExists(ctx, input);

		await ctx.db.batch([
			ctx.db.delete(artifactSource).where(eq(artifactSource.artifactId, input.artifactId)),
			ctx.db.delete(artifact).where(eq(artifact.id, input.artifactId)),
		]);

		await touchProject(ctx.db, input.projectId);

		return { id: input.artifactId };
	}),
});
