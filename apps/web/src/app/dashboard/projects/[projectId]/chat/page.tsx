import { assertAuthenticated } from "@/lib/auth-guard";

export default async function ChatPage({ params }: { params: Promise<{ projectId: string }> }) {
	await assertAuthenticated();
	const { projectId: _projectId } = await params;
	// TODO: verify the authenticated user has access to this project

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Chat</h1>
				<p className="text-sm text-muted-foreground">
					The conversational interface — the primary way to interact with the project's AI
					agent. Ask questions, request summaries, generate artifacts, and manage project
					state, all grounded in your uploaded sources.
				</p>
			</div>
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Chat interface will be rendered here. Features a message thread with streaming
					AI responses, inline citation chips that link to source passages, a message
					composer with file attachment support, conversation thread selector (multiple
					threads per project), and tool-call indicators for operations like artifact
					generation, file creation, or code execution.
				</p>
			</div>
		</div>
	);
}
