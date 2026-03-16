import { assertAuthenticated } from "@/lib/auth-guard";
import { DashboardProjectsView } from "@/components/workspace/dashboard-projects-view";

export default async function DashboardPage() {
	await assertAuthenticated();

	return (
		<div className="p-4">
			<DashboardProjectsView />
		</div>
	);
}
