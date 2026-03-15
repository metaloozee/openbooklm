import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export async function getServerSession() {
	return authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});
}

export async function assertAuthenticated() {
	const session = await getServerSession();

	if (!session?.user) {
		redirect("/login");
	}

	return session;
}

export async function assertProjectAccess(projectId: string) {
	void projectId;
	return assertAuthenticated();
}

export async function redirectIfAuthenticated() {
	const session = await getServerSession();

	if (session?.user) {
		redirect("/dashboard");
	}

	return session;
}
