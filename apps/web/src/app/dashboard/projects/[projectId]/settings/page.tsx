import { ProjectSettingsForm } from "@/components/workspace/project-settings-form";

export default async function ProjectSettingsPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const { projectId } = await params;

	return <ProjectSettingsForm projectId={projectId} />;
}
