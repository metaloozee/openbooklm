import { project } from "@openbooklm/db";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import type { Context } from "./context";

export async function getProjectForUserOrThrow(
	ctx: Pick<Context, "db" | "userId">,
	projectId: string,
) {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}

	const foundProject = await ctx.db.query.project.findFirst({
		where: and(eq(project.id, projectId), eq(project.ownerId, ctx.userId)),
	});

	if (!foundProject) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Project not found",
		});
	}

	return foundProject;
}

export async function touchProject(db: Context["db"], projectId: string) {
	await db
		.update(project)
		.set({
			updatedAt: new Date(),
		})
		.where(eq(project.id, projectId));
}
