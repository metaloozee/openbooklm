import { artifact, project, source } from "@openbooklm/db";
import { desc, eq } from "drizzle-orm";

import { projectCreateSchema, projectIdSchema, projectUpdateSchema } from "../contracts";
import { protectedProcedure, router } from "../index";
import { getProjectForUserOrThrow } from "../project-access";

function toIsoString(value: Date) {
	return value.toISOString();
}

function formatProjectListItem(
	record: typeof project.$inferSelect & {
		sources: Array<Pick<typeof source.$inferSelect, "id" | "status">>;
		artifacts: Array<Pick<typeof artifact.$inferSelect, "id">>;
	},
) {
	const indexedSourceCount = record.sources.filter((item) => item.status === "indexed").length;
	const pendingSourceCount = record.sources.filter((item) => item.status !== "indexed").length;

	return {
		id: record.id,
		name: record.name,
		description: record.description,
		icon: record.icon,
		visibility: record.visibility,
		defaultModelProvider: record.defaultModelProvider,
		defaultModel: record.defaultModel,
		sourceCount: record.sources.length,
		indexedSourceCount,
		pendingSourceCount,
		artifactCount: record.artifacts.length,
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
		const records = await ctx.db.query.project.findMany({
			where: eq(project.ownerId, ctx.userId),
			with: {
				sources: {
					columns: {
						id: true,
						status: true,
					},
				},
				artifacts: {
					columns: {
						id: true,
					},
				},
			},
			orderBy: [desc(project.updatedAt)],
		});

		return records.map(formatProjectListItem);
	}),
	byId: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
		const currentProject = await getProjectForUserOrThrow(ctx, input.projectId);

		const [projectSources, projectArtifacts] = await Promise.all([
			ctx.db.query.source.findMany({
				where: eq(source.projectId, input.projectId),
				orderBy: [desc(source.updatedAt)],
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
			}),
		]);

		const indexedSourceCount = projectSources.filter((item) => item.status === "indexed").length;

		return {
			project: formatProjectDetail(currentProject),
			stats: {
				sourceCount: projectSources.length,
				indexedSourceCount,
				pendingSourceCount: projectSources.length - indexedSourceCount,
				artifactCount: projectArtifacts.length,
			},
			recentSources: projectSources.slice(0, 5).map((item) => ({
				id: item.id,
				title: item.title,
				type: item.type,
				status: item.status,
				pageCount: item.pageCount,
				chunkCount: item.chunkCount,
				updatedAt: toIsoString(item.updatedAt),
			})),
			recentArtifacts: projectArtifacts.slice(0, 5).map((item) => ({
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
		const [createdProject] = await ctx.db
			.insert(project)
			.values({
				ownerId: ctx.userId,
				name: input.name,
				description: input.description ?? "",
				icon: input.icon,
				visibility: input.visibility,
				defaultModelProvider: input.defaultModelProvider,
				defaultModel: input.defaultModel,
			})
			.returning({ id: project.id });

		return createdProject;
	}),
	update: protectedProcedure.input(projectUpdateSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const [updatedProject] = await ctx.db
			.update(project)
			.set({
				name: input.name,
				description: input.description ?? "",
				icon: input.icon,
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
