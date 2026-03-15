import { assertAuthenticated } from "@/lib/auth-guard";

export default async function DashboardPage() {
	await assertAuthenticated();

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Projects</h1>
				<p className="text-sm text-muted-foreground">
					Your research workspaces. Each project contains sources, conversations, and
					generated artifacts grounded in your uploaded materials.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Project listing will be rendered here. Shows all projects owned by or shared
					with the current user, with search, sort, and a create-new-project action.
				</p>
			</div>
		</div>
	);
}
