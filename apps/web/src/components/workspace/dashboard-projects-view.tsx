"use client";

import { Button } from "@openbooklm/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@openbooklm/ui/components/card";
import { Input } from "@openbooklm/ui/components/input";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowRightIcon,
	FolderOpenIcon,
	PlusIcon,
	SearchIcon,
	SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

import {
	EmptyState,
	QueryErrorState,
	StatusBadge,
	formatDate,
} from "@/components/workspace/primitives";
import { CreateProjectDialog } from "@/components/workspace/new-project-form";
import { trpc } from "@/utils/trpc";

export function DashboardProjectsView() {
	const [search, setSearch] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const projectsQuery = useQuery(trpc.projects.list.queryOptions());

	const filteredProjects = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		if (!normalizedSearch) {
			return projectsQuery.data ?? [];
		}

		return (projectsQuery.data ?? []).filter((project) => {
			return (
				project.name.toLowerCase().includes(normalizedSearch) ||
				project.description.toLowerCase().includes(normalizedSearch)
			);
		});
	}, [projectsQuery.data, search]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-lg font-semibold tracking-tight">Projects</h1>
					<p className="text-sm text-muted-foreground">
						Your research workspaces. Each project bundles sources, artifacts,
						and grounded conversations.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="relative">
						<SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							aria-label="Search projects"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search..."
							className="w-full pl-8 sm:w-48"
						/>
					</div>
					<Button onClick={() => setIsCreateOpen(true)}>
						<PlusIcon data-icon="inline-start" />
						New project
					</Button>
				</div>
			</div>

			{projectsQuery.isPending ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className="flex flex-col gap-3">
								<Skeleton className="h-5 w-36" />
								<Skeleton className="h-3.5 w-full" />
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-3 w-32" />
							</CardContent>
						</Card>
					))}
				</div>
			) : projectsQuery.isError ? (
				<QueryErrorState
					title="Projects unavailable"
					description={projectsQuery.error.message}
					onRetry={() => void projectsQuery.refetch()}
				/>
			) : filteredProjects.length === 0 ? (
				<EmptyState
					icon={FolderOpenIcon}
					title={
						projectsQuery.data?.length
							? "No matching projects"
							: "Create your first project"
					}
					description={
						projectsQuery.data?.length
							? "Adjust the search term or create a new workspace."
							: "Projects are the top-level workspaces for sources, artifacts, and settings."
					}
					action={
						<Button onClick={() => setIsCreateOpen(true)}>
							<PlusIcon data-icon="inline-start" />
							New project
						</Button>
					}
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredProjects.map((project) => (
						<Card
							key={project.id}
							className="group transition-colors hover:border-foreground/20"
						>
							<CardHeader>
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-start gap-3">
										<span
											className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base"
											aria-hidden
										>
											{project.icon || "📁"}
										</span>
										<div>
											<CardTitle className="leading-snug">
												{project.name}
											</CardTitle>
											<CardDescription className="mt-0.5 line-clamp-2">
												{project.description ||
													"No description yet."}
											</CardDescription>
										</div>
									</div>
									<StatusBadge
										status={
											project.pendingSourceCount > 0
												? "pending"
												: "ready"
										}
									/>
								</div>
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs/relaxed">
								<div>
									<p className="text-muted-foreground">Sources</p>
									<p className="font-medium tabular-nums">
										{project.indexedSourceCount}/{project.sourceCount}{" "}
										indexed
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Artifacts</p>
									<p className="font-medium tabular-nums">
										{project.artifactCount}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Model</p>
									<p className="font-medium truncate">
										{project.defaultModel}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Updated</p>
									<p className="font-medium">
										{formatDate(project.updatedAt)}
									</p>
								</div>
							</CardContent>
							<CardFooter className="justify-between gap-2">
								<Button variant="ghost" size="sm" asChild>
									<Link
										href={
											`/dashboard/projects/${project.id}/settings` as Route
										}
									>
										<SettingsIcon data-icon="inline-start" />
										Settings
									</Link>
								</Button>
								<Button variant="outline" size="sm" asChild>
									<Link
										href={
											`/dashboard/projects/${project.id}` as Route
										}
									>
										Open
										<ArrowRightIcon data-icon="inline-end" />
									</Link>
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}

			<CreateProjectDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>
		</div>
	);
}
