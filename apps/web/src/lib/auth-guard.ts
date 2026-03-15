import { project, db } from "@openbooklm/db";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export async function assertAuthenticated() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return session;
}

export async function assertProjectAccess(projectId: string) {
	const session = await assertAuthenticated();

	const currentProject = await db.query.project.findFirst({
		where: and(eq(project.id, projectId), eq(project.ownerId, session.user.id)),
	});

	if (!currentProject) {
		redirect("/dashboard");
	}

	return {
		session,
		project: currentProject,
	};
}
