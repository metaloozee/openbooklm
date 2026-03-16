import { artifact, source } from "@openbooklm/db";
import { desc, eq } from "drizzle-orm";

import { projectIdSchema } from "../contracts";
import { protectedProcedure, router } from "../index";
import { getProjectForUserOrThrow } from "../project-access";

function toIsoString(value: Date) {
	return value.toISOString();
}

function slugifySegment(value: string) {
	return (
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "") || "untitled"
	);
}

function getSourceExtension(type: "pdf" | "text" | "markdown" | "url") {
	switch (type) {
		case "pdf":
			return "pdf";
		case "markdown":
			return "md";
		case "url":
			return "url";
		default:
			return "txt";
	}
}

export const filesRouter = router({
	list: protectedProcedure.input(projectIdSchema).query(async ({ ctx, input }) => {
		await getProjectForUserOrThrow(ctx, input.projectId);

		const [projectSources, projectArtifacts] = await Promise.all([
			ctx.db.query.source.findMany({
				where: eq(source.projectId, input.projectId),
				orderBy: [desc(source.updatedAt)],
			}),
			ctx.db.query.artifact.findMany({
				where: eq(artifact.projectId, input.projectId),
				orderBy: [desc(artifact.updatedAt)],
			}),
		]);

		const folders = [
			{
				path: "/sources",
				label: "Sources",
				itemCount: projectSources.length,
			},
			{
				path: "/artifacts",
				label: "Artifacts",
				itemCount: projectArtifacts.length,
			},
		];

		const items = [
			...projectSources.map((item) => ({
				id: item.id,
				kind: "source" as const,
				path: `/sources/${slugifySegment(item.title)}-${item.id}.${getSourceExtension(item.type)}`,
				title: item.title,
				type: item.type,
				status: item.status,
				sizeBytes: item.contentBytes,
				updatedAt: toIsoString(item.updatedAt),
			})),
			...projectArtifacts.map((item) => ({
				id: item.id,
				kind: "artifact" as const,
				path: `/artifacts/${slugifySegment(item.title)}-${item.id}.md`,
				title: item.title,
				type: item.type,
				status: "ready" as const,
				sizeBytes: new TextEncoder().encode(item.content).length,
				updatedAt: toIsoString(item.updatedAt),
			})),
		].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

		return {
			folders,
			items,
		};
	}),
});
