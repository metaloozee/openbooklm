"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@openbooklm/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@openbooklm/ui/components/sidebar";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

function UserAvatar({ name }: { name: string }) {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[0.6875rem] font-semibold text-muted-foreground">
			{initials}
		</div>
	);
}

export function NavUser() {
	const router = useRouter();
	const { isMobile } = useSidebar();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<div className="flex items-center gap-2 p-2">
						<Skeleton className="size-8 rounded-lg" />
						<div className="flex flex-1 flex-col gap-1">
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-2.5 w-32" />
						</div>
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
						>
							<UserAvatar name={session.user.name} />
							<div className="grid flex-1 text-left leading-tight">
								<span className="truncate text-xs font-medium">
									{session.user.name}
								</span>
								<span className="truncate text-[0.6875rem] text-muted-foreground">
									{session.user.email}
								</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left">
								<UserAvatar name={session.user.name} />
								<div className="grid flex-1 text-left leading-tight">
									<span className="truncate text-xs font-medium">
										{session.user.name}
									</span>
									<span className="truncate text-[0.6875rem] text-muted-foreground">
										{session.user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								variant="destructive"
								onClick={() => {
									authClient.signOut({
										fetchOptions: {
											onSuccess: () => {
												router.push("/");
											},
										},
									});
								}}
							>
								<LogOutIcon />
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
