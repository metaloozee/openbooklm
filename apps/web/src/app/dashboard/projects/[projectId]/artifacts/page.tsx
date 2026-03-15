import { ArtifactsManager } from "@/components/workspace/artifacts-manager";

export default async function ArtifactsPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const { projectId } = await params;

	return <ArtifactsManager projectId={projectId} />;
}
