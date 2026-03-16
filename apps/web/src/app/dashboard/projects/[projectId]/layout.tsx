import { assertProjectAccess } from "@/lib/auth-guard";
import { ProjectWorkspaceShell } from "@/components/workspace/project-workspace-shell";

export default async function ProjectLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ projectId: string }>;
}) {
	const { projectId } = await params;
	await assertProjectAccess(projectId);

	return <ProjectWorkspaceShell projectId={projectId}>{children}</ProjectWorkspaceShell>;
}
