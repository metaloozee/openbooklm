import { ArtifactEditorView } from "@/components/workspace/artifact-editor-view";

export default async function ArtifactDetailPage({
	params,
}: {
	params: Promise<{ projectId: string; artifactId: string }>;
}) {
	const { projectId, artifactId } = await params;

	return <ArtifactEditorView projectId={projectId} artifactId={artifactId} />;
}
