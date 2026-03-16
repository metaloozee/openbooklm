import { assertAuthenticated } from "@/lib/auth-guard";
import { MessageSquareIcon } from "lucide-react";

export default async function ChatPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	await assertAuthenticated();
	const { projectId: _projectId } = await params;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Chat</h1>
				<p className="text-sm text-muted-foreground">
					The conversational interface — the primary way to interact with the
					project&apos;s AI agent.
				</p>
			</div>
			<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-muted">
					<MessageSquareIcon className="size-6 text-muted-foreground" />
				</div>
				<div className="max-w-md">
					<p className="text-sm font-medium">Coming soon</p>
					<p className="mt-1 text-xs/relaxed text-muted-foreground">
						Ask questions, request summaries, generate artifacts, and manage
						project state — all grounded in your uploaded sources with inline
						citations.
					</p>
				</div>
			</div>
		</div>
	);
}
