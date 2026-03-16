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
	FolderOpenIcon,
	LayoutDashboardIcon,
	PlusIcon,
	SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NavUser } from "./nav-user";
import { AddSourceDialog } from "@/components/workspace/sources-manager";
import { CreateArtifactDialog } from "@/components/workspace/artifacts-manager";
import { ProjectWorkspaceTree } from "@/components/workspace/project-workspace-tree";
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

	const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
	const [isAddArtifactOpen, setIsAddArtifactOpen] = useState(false);

	const globalItems = [
		{
			href: "/dashboard" as Route,
			label: "Dashboard",
			icon: LayoutDashboardIcon,
		},
		{
			href: "/dashboard/settings" as Route,
			label: "Settings",
			icon: SettingsIcon,
		},
	];

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
		<>
			<SidebarGroup>
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
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarGroup className="group-data-[collapsible=icon]:hidden">
				<SidebarGroupLabel className="flex items-center justify-between">
					<span>Workspace</span>
					<Link
						href={`/dashboard/projects/${projectId}/settings` as Route}
						className="inline-flex size-5 items-center justify-center rounded-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
					>
						<SettingsIcon className="size-3.5" />
						<span className="sr-only">Project settings</span>
					</Link>
				</SidebarGroupLabel>
				<SidebarGroupContent>
					{projectId ? (
						<ProjectWorkspaceTree
							projectId={projectId}
							projectName={currentProject?.name ?? "Project"}
							onAddSource={() => setIsAddSourceOpen(true)}
							onAddArtifact={() => setIsAddArtifactOpen(true)}
						/>
					) : null}
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	);

	return (
		<>
			<Sidebar collapsible="icon" variant="inset" {...props}>
				<SidebarHeader>
					<Link href="/" className="mx-auto flex items-center justify-center gap-2 p-1">
						<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
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
							{isProjectRoute
								? renderProjectNavigation()
								: renderMenuGroup({
										label: "Global",
										items: globalItems,
									})}
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
								<SidebarGroup className="group-data-[collapsible=icon]:hidden">
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
							{renderMenuGroup({
								label: "Global",
								items: globalItems,
							})}

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

			{projectId ? (
				<>
					<AddSourceDialog
						projectId={projectId}
						open={isAddSourceOpen}
						onOpenChange={setIsAddSourceOpen}
					/>
					<CreateArtifactDialog
						projectId={projectId}
						open={isAddArtifactOpen}
						onOpenChange={setIsAddArtifactOpen}
					/>
				</>
			) : null}
		</>
	);
}
