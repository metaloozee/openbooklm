import { auth } from "@openbooklm/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getServerSession() {
	return auth.api.getSession({
		headers: await headers(),
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
