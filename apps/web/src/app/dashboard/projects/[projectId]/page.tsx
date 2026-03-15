export default function ProjectOverviewPage({
	params: _params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Project Overview</h1>
				<p className="text-sm text-muted-foreground">
					The workspace landing page for a single project. Shows a high-level summary of
					the project state — source count, recent conversations, latest artifacts, and
					index health.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Project overview dashboard will be rendered here. Displays project metadata
					(name, description, creation date), source statistics (total sources, indexed
					count, pending), recent conversation threads, recently generated artifacts, and
					quick actions (upload source, start chat, generate artifact).
				</p>
			</div>
		</div>
	);
}
