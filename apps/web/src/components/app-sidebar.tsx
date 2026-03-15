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
		<Sidebar collapsible="icon" variant={"inset"} {...props}>
			<SidebarHeader>
				<div className="flex items-center justify-center mx-auto gap-2 p-1">
					<div className="flex size-7  shrink-0 items-center justify-center rounded-md bg-foreground text-background">
						<BookOpenIcon className="size-3.5" />
					</div>
					<span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
						OpenBookLM
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
