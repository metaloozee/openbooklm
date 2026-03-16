import { artifact, project, source } from "@openbooklm/db";
import { and, desc, eq, sql } from "drizzle-orm";

import { projectCreateSchema, projectIdSchema, projectUpdateSchema } from "../contracts";
import { protectedProcedure, router } from "../index";
import { getProjectForUserOrThrow } from "../project-access";

function toIsoString(value: Date) {
	return value.toISOString();
}

function formatProjectListItem(
	record: typeof project.$inferSelect & {
		sourceCount: number;
		indexedSourceCount: number;
		artifactCount: number;
	},
) {
	return {
		id: record.id,
		name: record.name,
		description: record.description,
		icon: record.icon,
		visibility: record.visibility,
		defaultModelProvider: record.defaultModelProvider,
		defaultModel: record.defaultModel,
		sourceCount: record.sourceCount,
		indexedSourceCount: record.indexedSourceCount,
		pendingSourceCount: record.sourceCount - record.indexedSourceCount,
		artifactCount: record.artifactCount,
		createdAt: toIsoString(record.createdAt),
		updatedAt: toIsoString(record.updatedAt),
	};
}

function formatProjectDetail(record: typeof project.$inferSelect) {
	return {
		id: record.id,
		name: record.name,
		description: record.description,
		icon: record.icon,
		visibility: record.visibility,
		defaultModelProvider: record.defaultModelProvider,
		defaultModel: record.defaultModel,
		embeddingProvider: record.embeddingProvider,
		embeddingModel: record.embeddingModel,
		chunkSize: record.chunkSize,
		chunkOverlap: record.chunkOverlap,
		refreshOnSourceChange: record.refreshOnSourceChange,
		createdAt: toIsoString(record.createdAt),
		updatedAt: toIsoString(record.updatedAt),
	};
}

export const projectsRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const records = await ctx.db
			.select({
				id: project.id,
				ownerId: project.ownerId,
				name: project.name,
				description: project.description,
				icon: project.icon,
				visibility: project.visibility,
				defaultModelProvider: project.defaultModelProvider,
				defaultModel: project.defaultModel,
				embeddingProvider: project.embeddingProvider,
				embeddingModel: project.embeddingModel,
				chunkSize: project.chunkSize,
				chunkOverlap: project.chunkOverlap,
				refreshOnSourceChange: project.refreshOnSourceChange,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt,
				sourceCount: sql<number>`(
					select count(*)::int
					from ${source}
					where ${source.projectId} = ${project.id}
				)`,
				indexedSourceCount: sql<number>`(
					select count(*)::int
					from ${source}
					where ${source.projectId} = ${project.id}
						and ${source.status} = 'indexed'
				)`,
				artifactCount: sql<number>`(
					select count(*)::int
					from ${artifact}
					where ${artifact.projectId} = ${project.id}
				)`,
			})
			.from(project)
			.where(eq(project.ownerId, ctx.userId))
			.orderBy(desc(project.updatedAt));

		return records.map(formatProjectListItem);
	}),
	byId: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
		const currentProject = await getProjectForUserOrThrow(ctx, input.projectId);

		const [sourceCount, indexedSourceCount, artifactCount, recentSources, recentArtifacts] =
			await Promise.all([
				ctx.db.$count(source, eq(source.projectId, input.projectId)),
				ctx.db.$count(
					source,
					and(eq(source.projectId, input.projectId), eq(source.status, "indexed")),
				),
				ctx.db.$count(artifact, eq(artifact.projectId, input.projectId)),
				ctx.db.query.source.findMany({
					where: eq(source.projectId, input.projectId),
					orderBy: [desc(source.updatedAt)],
					limit: 5,
				}),
				ctx.db.query.artifact.findMany({
					where: eq(artifact.projectId, input.projectId),
					with: {
						sourceLinks: {
							with: {
								source: true,
							},
						},
					},
					orderBy: [desc(artifact.updatedAt)],
					limit: 5,
				}),
			]);

		return {
			project: formatProjectDetail(currentProject),
			stats: {
				sourceCount,
				indexedSourceCount,
				pendingSourceCount: sourceCount - indexedSourceCount,
				artifactCount,
			},
			recentSources: recentSources.map((item) => ({
				id: item.id,
				title: item.title,
				type: item.type,
				status: item.status,
				pageCount: item.pageCount,
				chunkCount: item.chunkCount,
				updatedAt: toIsoString(item.updatedAt),
			})),
			recentArtifacts: recentArtifacts.map((item) => ({
				id: item.id,
				title: item.title,
				type: item.type,
				sourceCount: item.sourceLinks.length,
				sourceTitles: item.sourceLinks.map((link) => link.source.title),
				updatedAt: toIsoString(item.updatedAt),
			})),
		};
	}),
	create: protectedProcedure.input(projectCreateSchema).mutation(async ({ ctx, input }) => {
		const description = input.description.trim();
		const icon = input.icon.trim();

		const [createdProject] = await ctx.db
			.insert(project)
			.values({
				ownerId: ctx.userId,
				name: input.name,
				description,
				icon: icon || undefined,
				visibility: input.visibility,
				defaultModelProvider: input.defaultModelProvider,
				defaultModel: input.defaultModel,
			})
			.returning({ id: project.id });

		return createdProject;
	}),
	update: protectedProcedure.input(projectUpdateSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);
		const description = input.description.trim();
		const icon = input.icon.trim();

		const [updatedProject] = await ctx.db
			.update(project)
			.set({
				name: input.name,
				description,
				icon: icon || undefined,
				visibility: input.visibility,
				defaultModelProvider: input.defaultModelProvider,
				defaultModel: input.defaultModel,
				embeddingProvider: input.embeddingProvider,
				embeddingModel: input.embeddingModel,
				chunkSize: input.chunkSize,
				chunkOverlap: input.chunkOverlap,
				refreshOnSourceChange: input.refreshOnSourceChange,
				updatedAt: new Date(),
			})
			.where(eq(project.id, input.projectId))
			.returning({ id: project.id });

		return updatedProject;
	}),
	delete: protectedProcedure.input(projectIdSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const [deletedProject] = await ctx.db
			.delete(project)
			.where(eq(project.id, input.projectId))
			.returning({ id: project.id });

		return deletedProject;
	}),
});
