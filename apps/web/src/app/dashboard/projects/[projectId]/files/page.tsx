import { FilesBrowser } from "@/components/workspace/files-browser";

export default async function FilesPage({ params }: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await params;

	return <FilesBrowser projectId={projectId} />;
}
