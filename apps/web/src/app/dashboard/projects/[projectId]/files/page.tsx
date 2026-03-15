import { assertAuthenticated } from "@/lib/auth-guard";

export default async function FilesPage({ params }: { params: Promise<{ projectId: string }> }) {
	await assertAuthenticated();
	const { projectId: _projectId } = await params;
	// TODO: verify the authenticated user has access to this project

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Files</h1>
				<p className="text-sm text-muted-foreground">
					The virtual file system for this project. A unified view of all project content
					— uploaded sources, generated artifacts, notes, code files, and index data —
					organized in a navigable tree structure.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					File system explorer will be rendered here. Renders a tree view of the project's
					virtual file system with directories like /sources, /artifacts, /notes, and
					/code. Supports file preview (text, PDF, markdown, images), inline editing for
					text-based files, drag-and-drop organization, and contextual actions (rename,
					move, delete, download). This view is the "repo-like" window into the project.
				</p>
			</div>
		</div>
	);
}
