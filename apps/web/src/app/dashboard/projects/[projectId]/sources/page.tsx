export default function SourcesPage({
	params: _params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Sources</h1>
				<p className="text-sm text-muted-foreground">
					Manage the source documents that ground this project's AI responses. Sources are
					the "truth" — every answer the agent gives will cite specific passages from
					these materials.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Source management interface will be rendered here. Includes a drag-and-drop
					upload zone (PDF, text, markdown, URL), a list/grid of existing sources with
					processing status (pending, indexing, indexed, failed), per-source metadata
					(title, type, page count, chunk count), and actions to preview, re-index, or
					remove sources.
				</p>
			</div>
		</div>
	);
}
