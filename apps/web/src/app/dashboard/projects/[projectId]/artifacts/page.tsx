import { assertAuthenticated } from "@/lib/auth-guard";

export default async function ArtifactsPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	await assertAuthenticated();
	const { projectId: _projectId } = await params;
	// TODO: verify the authenticated user has access to this project

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Artifacts</h1>
				<p className="text-sm text-muted-foreground">
					Generated outputs derived from your project's sources. Artifacts are the
					tangible products of AI analysis — summaries, reports, study guides, FAQs,
					timelines, and more.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Artifact browser will be rendered here. Displays a grid or list of generated
					artifacts with type badges (summary, FAQ, study guide, report, mind map, audio
					overview), creation timestamps, source attribution (which sources each artifact
					was derived from), and actions to view, regenerate, export, or delete. Each
					artifact links back to the conversation turn that created it.
				</p>
			</div>
		</div>
	);
}
