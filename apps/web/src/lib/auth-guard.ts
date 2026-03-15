import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export async function assertAuthenticated() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		notFound();
	}

	return session;
}
