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
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

import {
	EmptyState,
	QueryErrorState,
	StatusBadge,
	formatDate,
} from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function DashboardProjectsView() {
	const [search, setSearch] = useState("");
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
		<div className="space-y-4">
			<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-lg font-semibold tracking-tight">Projects</h1>
					<p className="text-sm text-muted-foreground">
						Your research workspaces. Each project bundles sources, artifacts, settings,
						and future grounded conversations.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Input
						aria-label="Search projects"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search projects"
						className="w-full sm:w-56"
					/>
					<Button asChild>
						<Link href="/dashboard/projects/new">Create project</Link>
					</Button>
				</div>
			</div>

			{projectsQuery.isPending ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-full" />
							</CardHeader>
							<CardContent className="space-y-2">
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-3 w-28" />
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
						<Button asChild>
							<Link href="/dashboard/projects/new">New project</Link>
						</Button>
					}
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredProjects.map((project) => (
						<Card key={project.id}>
							<CardHeader>
								<div className="flex items-start justify-between gap-3">
									<div>
										<CardTitle>{project.name}</CardTitle>
										<CardDescription className="mt-1">
											{project.description || "No description yet."}
										</CardDescription>
									</div>
									<StatusBadge
										status={
											project.pendingSourceCount > 0 ? "pending" : "ready"
										}
									/>
								</div>
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-3 text-xs/relaxed">
								<div>
									<p className="text-muted-foreground">Sources</p>
									<p className="font-medium">
										{project.indexedSourceCount}/{project.sourceCount} indexed
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Artifacts</p>
									<p className="font-medium">{project.artifactCount}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Model</p>
									<p className="font-medium">{project.defaultModel}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Updated</p>
									<p className="font-medium">{formatDate(project.updatedAt)}</p>
								</div>
							</CardContent>
							<CardFooter className="justify-between gap-2">
								<Button variant="outline" asChild>
									<Link
										href={`/dashboard/projects/${project.id}/settings` as Route}
									>
										Settings
									</Link>
								</Button>
								<Button asChild>
									<Link href={`/dashboard/projects/${project.id}` as Route}>
										Open workspace
									</Link>
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
