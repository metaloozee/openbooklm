import { SourcesManager } from "@/components/workspace/sources-manager";

export default async function SourcesPage({ params }: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await params;

	return <SourcesManager projectId={projectId} />;
}
