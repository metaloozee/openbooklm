import { ArtifactDetailView } from "@/components/workspace/artifact-detail-view";

export default async function ArtifactDetailPage({
	params,
}: {
	params: Promise<{ projectId: string; artifactId: string }>;
}) {
	const { projectId, artifactId } = await params;

	return <ArtifactDetailView projectId={projectId} artifactId={artifactId} />;
}
