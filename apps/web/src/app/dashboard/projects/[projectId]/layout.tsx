import { assertProjectAccess } from "@/lib/auth-guard";

export default async function ProjectLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ projectId: string }>;
}) {
	const { projectId } = await params;
	await assertProjectAccess(projectId);

	return <>{children}</>;
}
