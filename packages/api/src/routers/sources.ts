import { source } from "@openbooklm/db";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { sourceActionSchema, sourceCreateSchema } from "../contracts";
import { protectedProcedure, router } from "../index";
import { getProjectForUserOrThrow, touchProject } from "../project-access";

function toIsoString(value: Date) {
	return value.toISOString();
}

function estimateChunkCount(content: string) {
	if (!content.trim()) {
		return 0;
	}

	return Math.max(1, Math.ceil(content.length / 1200));
}

function deriveSourceMetrics(input: {
	type: "pdf" | "text" | "markdown" | "url";
	content?: string;
	url?: string;
	indexNow: boolean;
}) {
	const payload = input.type === "url" ? (input.url ?? "") : (input.content ?? "");
	const contentBytes = new TextEncoder().encode(payload).length;
	const shouldIndex = input.indexNow && payload.trim().length > 0;

	return {
		contentBytes,
		pageCount: input.type === "pdf" ? Math.max(0, Math.ceil(contentBytes / 4000)) : 1,
		chunkCount: shouldIndex ? estimateChunkCount(payload) : 0,
		status: shouldIndex ? ("indexed" as const) : ("pending" as const),
		indexedAt: shouldIndex ? new Date() : null,
	};
}

export const sourcesRouter = router({
	list: protectedProcedure
		.input(sourceActionSchema.pick({ projectId: true }))
		.query(async ({ ctx, input }) => {
			await getProjectForUserOrThrow(ctx, input.projectId);

			const records = await ctx.db.query.source.findMany({
				where: eq(source.projectId, input.projectId),
				orderBy: [desc(source.updatedAt)],
			});

			return records.map((item) => ({
				id: item.id,
				projectId: item.projectId,
				title: item.title,
				type: item.type,
				status: item.status,
				url: item.url,
				excerpt:
					item.type === "url"
						? (item.url ?? "")
						: item.content.length > 180
							? `${item.content.slice(0, 177)}...`
							: item.content,
				pageCount: item.pageCount,
				chunkCount: item.chunkCount,
				contentBytes: item.contentBytes,
				createdAt: toIsoString(item.createdAt),
				updatedAt: toIsoString(item.updatedAt),
				indexedAt: item.indexedAt ? toIsoString(item.indexedAt) : null,
			}));
		}),
	create: protectedProcedure.input(sourceCreateSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const derivedMetrics = deriveSourceMetrics({
			type: input.type,
			content: input.content,
			url: input.url,
			indexNow: input.indexNow,
		});
		const trimmedUrl = input.url.trim();

		const [createdSource] = await ctx.db
			.insert(source)
			.values({
				projectId: input.projectId,
				title: input.title,
				type: input.type,
				url: trimmedUrl || undefined,
				content: input.type === "url" ? "" : input.content,
				contentBytes: derivedMetrics.contentBytes,
				pageCount: derivedMetrics.pageCount,
				chunkCount: derivedMetrics.chunkCount,
				status: derivedMetrics.status,
				indexedAt: derivedMetrics.indexedAt,
			})
			.returning({ id: source.id });

		await touchProject(ctx.db, input.projectId);

		return createdSource;
	}),
	reindex: protectedProcedure.input(sourceActionSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const currentSource = await ctx.db.query.source.findFirst({
			where: and(eq(source.id, input.sourceId), eq(source.projectId, input.projectId)),
		});

		if (!currentSource) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Source not found",
			});
		}

		const payload =
			currentSource.type === "url" ? (currentSource.url ?? "") : currentSource.content;
		const trimmedPayload = payload.trim();

		const [updatedSource] = await ctx.db
			.update(source)
			.set({
				status: trimmedPayload.length > 0 ? "indexed" : currentSource.status,
				chunkCount: trimmedPayload.length > 0 ? estimateChunkCount(payload) : currentSource.chunkCount,
				indexedAt: trimmedPayload.length > 0 ? new Date() : currentSource.indexedAt,
				contentBytes:
					trimmedPayload.length > 0
						? new TextEncoder().encode(payload).length
						: currentSource.contentBytes,
				pageCount:
					trimmedPayload.length > 0
						? currentSource.type === "pdf"
							? Math.max(0, Math.ceil(new TextEncoder().encode(payload).length / 4000))
							: 1
						: currentSource.pageCount,
				updatedAt: new Date(),
			})
			.where(eq(source.id, input.sourceId))
			.returning({ id: source.id });

		await touchProject(ctx.db, input.projectId);

		return updatedSource;
	}),
	delete: protectedProcedure.input(sourceActionSchema).mutation(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const [deletedSource] = await ctx.db
			.delete(source)
			.where(and(eq(source.id, input.sourceId), eq(source.projectId, input.projectId)))
			.returning({ id: source.id });

		await touchProject(ctx.db, input.projectId);

		return deletedSource;
	}),
});
