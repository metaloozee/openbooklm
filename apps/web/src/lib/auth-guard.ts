import type { AppRouter } from "@openbooklm/api/routers/index";
import { TRPCClientError, createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { getServerUrl } from "@/lib/server-url";

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

async function getServerTrpcClient() {
	const requestHeaders = await headers();

	return createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: new URL("/trpc", getServerUrl()).toString(),
				headers: Object.fromEntries(requestHeaders.entries()),
			}),
		],
	});
}

export async function assertProjectAccess(projectId: string) {
	const session = await assertAuthenticated();

	try {
		const trpcClient = await getServerTrpcClient();
		await trpcClient.projects.byId.query({ projectId });
		return session;
	} catch (error) {
		if (
			error instanceof TRPCClientError &&
			["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"].includes(error.data?.code ?? "")
		) {
			redirect("/dashboard");
		}

		throw error;
	}
}

export async function redirectIfAuthenticated() {
	const session = await getServerSession();

	if (session?.user) {
		redirect("/dashboard");
	}

	return session;
}
