export default function ProjectSettingsPage({
	params: _params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Project Settings</h1>
				<p className="text-sm text-muted-foreground">
					Configure this project's AI behavior, model preferences, indexing strategy, and
					general metadata. Settings here override account-level defaults for this project
					only.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Project settings form will be rendered here. Sections include: General (name,
					description, icon, visibility), Model (default LLM provider and model,
					temperature, system prompt), Indexing (embedding model, chunk size, overlap,
					refresh policy), Tools (enabled sandbox tools, custom plugins), and Danger Zone
					(archive or delete project). Changes save immediately or on explicit submit
					depending on the field.
				</p>
			</div>
		</div>
	);
}
