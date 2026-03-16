import { assertAuthenticated } from "@/lib/auth-guard";
import { NewProjectForm } from "@/components/workspace/new-project-form";

export default async function NewProjectPage() {
	await assertAuthenticated();

	return <NewProjectForm />;
}
