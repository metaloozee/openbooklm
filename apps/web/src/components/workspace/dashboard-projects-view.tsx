"use client";

import { Button } from "@openbooklm/ui/components/button";
import { Input } from "@openbooklm/ui/components/input";
import {
	PerspectiveBook,
	BookTitle,
	BookDescription,
} from "@openbooklm/ui/components/perspective-book";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { FolderOpenIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@openbooklm/ui/components/empty";
import { QueryErrorState } from "@/components/workspace/primitives";
import { CreateProjectDialog } from "@/components/workspace/new-project-form";
import { trpc } from "@/utils/trpc";

export function DashboardProjectsView() {
	const [search, setSearch] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const projectsQuery = useQuery(trpc.projects.list.queryOptions());

	useEffect(() => {
		if (searchParams.get("create") !== "true") {
			return;
		}

		setIsCreateOpen(true);
		router.replace("/dashboard", { scroll: false });
	}, [searchParams, router]);

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
				<Empty className="border-2">
					<EmptyHeader>
						<EmptyMedia variant={"icon"}>
							<FolderOpenIcon />
						</EmptyMedia>
						<EmptyTitle>No projects found</EmptyTitle>
						<EmptyDescription>
							You haven&apos;t created any projects yet. Get started by creating your first project.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="flex flex-wrap gap-8">
					{filteredProjects.map((project) => (
						<Link
							key={project.id}
							href={`/dashboard/projects/${project.id}` as Route}
							className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
						>
							<PerspectiveBook>
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
