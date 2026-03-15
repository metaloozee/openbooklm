import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<>
			<h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
			<p className="text-sm text-muted-foreground">Welcome, {session.user.name}</p>
			<Dashboard session={session} />
		</>
	);
}
