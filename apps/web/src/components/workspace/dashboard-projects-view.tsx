"use client";

import { Badge } from "@openbooklm/ui/components/badge";
import { Button } from "@openbooklm/ui/components/button";
import { Input } from "@openbooklm/ui/components/input";
import {
	PerspectiveBook,
	BookHeader,
	BookTitle,
	BookDescription,
} from "@openbooklm/ui/components/perspective-book";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { FolderOpenIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

import { EmptyState, QueryErrorState } from "@/components/workspace/primitives";
import { CreateProjectDialog } from "@/components/workspace/new-project-form";
import { trpc } from "@/utils/trpc";

const COVER_PALETTES = [
	"bg-gradient-to-br from-rose-500 to-orange-400 text-white",
	"bg-gradient-to-br from-violet-600 to-indigo-500 text-white",
	"bg-gradient-to-br from-emerald-500 to-teal-400 text-white",
	"bg-gradient-to-br from-sky-500 to-cyan-400 text-white",
	"bg-gradient-to-br from-amber-500 to-yellow-400 text-white",
	"bg-gradient-to-br from-fuchsia-500 to-pink-400 text-white",
	"bg-gradient-to-br from-slate-700 to-slate-500 text-white",
	"bg-gradient-to-br from-lime-500 to-green-400 text-white",
];

function pickCoverColor(id: string) {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}
	return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length];
}

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
						Your research workspaces. Each project bundles sources, artifacts, and
						grounded conversations.
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
				<div className="flex flex-wrap gap-8">
					{Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} className="h-60 w-[196px] rounded-md" />
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
				<div className="flex flex-wrap gap-8">
					{filteredProjects.map((project) => (
						<Link
							key={project.id}
							href={`/dashboard/projects/${project.id}` as Route}
							className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
						>
							<PerspectiveBook className={pickCoverColor(project.id)}>
								<BookHeader>
									<Badge
										variant={
											project.pendingSourceCount > 0 ? "warning" : "success"
										}
										className="text-[10px]"
									>
										{project.pendingSourceCount > 0 ? "pending" : "ready"}
									</Badge>
									<Badge
										variant="outline"
										className="border-white/30 bg-white/10 text-[10px] text-inherit"
									>
										{project.sourceCount} sources
									</Badge>
								</BookHeader>
								<BookTitle>{project.name}</BookTitle>
								<BookDescription>
									{project.description || "No description yet."}
								</BookDescription>
							</PerspectiveBook>
						</Link>
					))}
				</div>
			)}

			<CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
		</div>
	);
}
