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
	void projectId;
	return assertAuthenticated();
}
