import { assertAuthenticated } from "@/lib/auth-guard";
import { UserSettingsForm } from "@/components/workspace/user-settings-form";

export default async function UserSettingsPage() {
	await assertAuthenticated();

	return (
		<div className="p-4">
			<UserSettingsForm />
		</div>
	);
}
