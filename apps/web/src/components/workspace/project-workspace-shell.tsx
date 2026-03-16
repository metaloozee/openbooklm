"use client";

import { Separator } from "@openbooklm/ui/components/separator";
import { usePathname } from "next/navigation";

import { ChatPanel } from "@/components/workspace/chat-panel";

const WORKSPACE_HEIGHT = "h-[calc(100vh-3rem-1px)]";

export function ProjectWorkspaceShell({
	projectId,
	children,
}: {
	projectId: string;
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isChatRoute = pathname.endsWith("/chat");

	if (isChatRoute) {
		return (
			<div className={`flex flex-col ${WORKSPACE_HEIGHT}`}>
				<ChatPanel projectId={projectId} />
			</div>
		);
	}

	return (
		<div className={`flex ${WORKSPACE_HEIGHT}`}>
			<div className="flex-1 p-4">{children}</div>
			{/* <Separator orientation="vertical" />
			<div className="hidden w-80 shrink-0 lg:flex lg:flex-col xl:w-96">
				<ChatPanel projectId={projectId} />
			</div> */}
		</div>
	);
}
