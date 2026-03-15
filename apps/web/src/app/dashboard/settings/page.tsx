export default function UserSettingsPage() {
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Manage your account, appearance preferences, and API key configuration for model
					providers. These settings apply as defaults across all your projects unless
					overridden at the project level.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					User settings interface will be rendered here. Sections include: Profile (name,
					email, avatar), Appearance (theme, sidebar default state, density), API Keys
					(add and manage keys for OpenAI, Anthropic, Google, Ollama, and custom
					providers), Defaults (preferred model, embedding provider, default project
					settings), and Sessions (active sessions, sign out of other devices).
				</p>
			</div>
		</div>
	);
}
