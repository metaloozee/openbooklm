"use client";

import { Button } from "@openbooklm/ui/components/button";
import { Separator } from "@openbooklm/ui/components/separator";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { MessageSquareIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

export function ChatPanel({ projectId: _projectId }: { projectId: string }) {
	const [draft, setDraft] = useState("");

	return (
		<div className="flex h-full flex-col">
			<div className="flex h-10 shrink-0 items-center gap-2 px-4">
				<MessageSquareIcon className="size-4 text-muted-foreground" />
				<span className="text-xs font-medium">Chat</span>
			</div>
			<Separator />
			<div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
				<div className="flex size-10 items-center justify-center rounded-full bg-muted">
					<SparklesIcon className="size-5 text-muted-foreground" />
				</div>
				<p className="text-xs font-medium">Ask anything about your sources</p>
				<p className="max-w-xs text-center text-xs/relaxed text-muted-foreground">
					Ask questions, request summaries, generate artifacts, and manage project state —
					all grounded in your uploaded sources.
				</p>
			</div>
			<div className="shrink-0 border-t p-3">
				<div className="flex gap-2">
					<Textarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						placeholder="Ask about your sources..."
						className="min-h-9 resize-none"
						rows={1}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								// TODO: call handleSubmit() once chat API is wired (see SendIcon button below)
							}
						}}
					/>
					<Button
						size="icon"
						disabled={!draft.trim()}
						onClick={() => {
							// TODO: send draft via chat API, then setDraft("")
						}}
					>
						<SendIcon />
					</Button>
				</div>
			</div>
		</div>
	);
}
