"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarRail,
} from "@openbooklm/ui/components/sidebar";
import { Button } from "@openbooklm/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	BookOpenIcon,
	FilesIcon,
	FolderOpenIcon,
	LayoutDashboardIcon,
	MessageSquareIcon,
	PlusIcon,
	SettingsIcon,
	SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { NavUser } from "./nav-user";
import { trpc } from "@/utils/trpc";

const RESERVED_PROJECT_SEGMENTS = new Set(["new"]);

function getProjectIdFromPathname(pathname: string) {
	const match = pathname.match(/^\/dashboard\/projects\/([^/]+)/);
	const slug = match?.[1] ?? null;
	return slug && !RESERVED_PROJECT_SEGMENTS.has(slug) ? slug : null;
}

function isActiveRoute(pathname: string, href: string) {
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const projectId = getProjectIdFromPathname(pathname);
	const projectsQuery = useQuery(trpc.projects.list.queryOptions());
	const currentProject = projectsQuery.data?.find((project) => project.id === projectId);
	const isProjectRoute = Boolean(projectId);
	const projectsErrorMessage =
		projectsQuery.error?.message ?? "Project navigation is unavailable.";

	const globalItems = [
		{
			href: "/dashboard" as Route,
			label: "Dashboard",
			icon: LayoutDashboardIcon,
		},
		{
			href: "/dashboard/projects/new" as Route,
			label: "New Project",
			icon: PlusIcon,
		},
		{
			href: "/dashboard/settings" as Route,
			label: "Settings",
			icon: SettingsIcon,
		},
	];

	const projectItems = projectId
		? [
				{
					href: `/dashboard/projects/${projectId}` as Route,
					label: "Overview",
					icon: LayoutDashboardIcon,
				},
				{
					href: `/dashboard/projects/${projectId}/sources` as Route,
					label: "Sources",
					icon: FolderOpenIcon,
				},
				{
					href: `/dashboard/projects/${projectId}/chat` as Route,
					label: "Chat",
					icon: MessageSquareIcon,
				},
				{
					href: `/dashboard/projects/${projectId}/artifacts` as Route,
					label: "Artifacts",
					icon: SparklesIcon,
				},
				{
					href: `/dashboard/projects/${projectId}/files` as Route,
					label: "Files",
					icon: FilesIcon,
				},
				{
					href: `/dashboard/projects/${projectId}/settings` as Route,
					label: "Settings",
					icon: SettingsIcon,
				},
			]
		: [];

	const renderMenuGroup = ({
		label,
		items,
	}: {
		label: string;
		items: Array<{
			href: Route;
			label: string;
			icon: React.ComponentType<{ className?: string }>;
		}>;
	}) => (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.href}>
							<SidebarMenuButton
								asChild
								isActive={isActiveRoute(pathname, item.href)}
								tooltip={item.label}
							>
								<Link href={item.href}>
									<item.icon />
									<span>{item.label}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);

	const renderProjectNavigation = () => (
		<SidebarGroup>
			<SidebarGroupLabel>{currentProject?.name ?? "Project"}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={pathname === "/dashboard"}
							tooltip="Back to dashboard"
						>
							<Link href="/dashboard">
								<ArrowLeftIcon />
								<span>Back to dashboard</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					{projectItems.map((item) => (
						<SidebarMenuItem key={item.href}>
							<SidebarMenuButton
								asChild
								isActive={isActiveRoute(pathname, item.href)}
								tooltip={item.label}
							>
								<Link href={item.href}>
									<item.icon />
									<span>{item.label}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);

	return (
		<Sidebar collapsible="icon" variant={"inset"} {...props}>
			<SidebarHeader>
				<Link href="/" className="flex items-center justify-center mx-auto gap-2 p-1">
					<div className="flex size-7  shrink-0 items-center justify-center rounded-md bg-foreground text-background">
						<BookOpenIcon className="size-3.5" />
					</div>
					<span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
						OpenBookLM
					</span>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				{projectsQuery.isPending ? (
					<SidebarGroup>
						<SidebarGroupLabel>Loading</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{Array.from({ length: 6 }).map((_, index) => (
									<SidebarMenuItem key={index}>
										<SidebarMenuSkeleton showIcon />
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				) : projectsQuery.isError ? (
					<>
						{isProjectRoute ? renderProjectNavigation() : renderMenuGroup({ label: "Global", items: globalItems })}
						<SidebarGroup>
							<SidebarGroupLabel>Projects unavailable</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<div className="rounded-md border border-dashed p-2 text-xs/relaxed text-sidebar-foreground/70">
											<p>{projectsErrorMessage}</p>
											<Button
												variant="outline"
												size="sm"
												className="mt-2 w-full"
												onClick={() => void projectsQuery.refetch()}
											>
												Retry
											</Button>
										</div>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</>
				) : isProjectRoute ? (
					<>
						{renderProjectNavigation()}

						{projectsQuery.data?.length ? (
							<SidebarGroup>
								<SidebarGroupLabel>Switch project</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{projectsQuery.data.map((project) => (
											<SidebarMenuItem key={project.id}>
												<SidebarMenuButton
													asChild
													isActive={project.id === projectId}
													tooltip={project.name}
												>
													<Link
														href={
															`/dashboard/projects/${project.id}` as Route
														}
													>
														<FolderOpenIcon />
														<span>{project.name}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						) : null}
					</>
				) : (
					<>
						{renderMenuGroup({ label: "Global", items: globalItems })}

						<SidebarGroup>
							<SidebarGroupLabel>Projects</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{projectsQuery.data?.length ? (
										projectsQuery.data.map((project) => (
											<SidebarMenuItem key={project.id}>
												<SidebarMenuButton
													asChild
													isActive={isActiveRoute(
														pathname,
														`/dashboard/projects/${project.id}`,
													)}
													tooltip={project.name}
												>
													<Link
														href={
															`/dashboard/projects/${project.id}` as Route
														}
													>
														<FolderOpenIcon />
														<span>{project.name}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))
									) : (
										<SidebarMenuItem>
											<SidebarMenuButton
												asChild
												tooltip="Create your first project"
											>
												<Link href="/dashboard/projects/new">
													<PlusIcon />
													<span>Create project</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</>
				)}
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
