"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@openbooklm/ui/components/sidebar";
import { BookOpenIcon } from "lucide-react";

import { NavUser } from "./nav-user";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center gap-2 px-1 py-1">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
						<BookOpenIcon className="size-4" />
					</div>
					<span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
						openbooklm
					</span>
				</div>
			</SidebarHeader>
			<SidebarContent />
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
