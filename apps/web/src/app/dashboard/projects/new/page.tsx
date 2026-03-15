import { assertAuthenticated } from "@/lib/auth-guard";

export default async function NewProjectPage() {
	await assertAuthenticated();

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">New Project</h1>
				<p className="text-sm text-muted-foreground">
					Create a new research workspace. A project is the fundamental unit of
					organization in OpenBookLM — it holds your sources, conversations, and generated
					artifacts.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Project creation form will be rendered here. Fields include project name,
					description, optional icon, and initial model/provider selection. On submit, the
					project is created with an empty source index and the user is redirected to the
					project workspace.
				</p>
			</div>
		</div>
	);
}
