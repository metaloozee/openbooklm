"use client";

import { Button } from "@openbooklm/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@openbooklm/ui/components/card";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
	BookOpenIcon,
	ClockIcon,
	FileTextIcon,
	FolderOpenIcon,
	LayersIcon,
	PlusIcon,
	SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import { EmptyState, StatCard, StatusBadge, formatDate } from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function ProjectOverviewView({ projectId }: { projectId: string }) {
	const projectQuery = useQuery(trpc.projects.byId.queryOptions({ projectId }));

	if (projectQuery.isPending) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="h-20 w-full" />
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} className="h-28 w-full" />
					))}
				</div>
				<div className="grid gap-4 xl:grid-cols-2">
					<Skeleton className="h-64 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
		);
	}

	if (!projectQuery.data) {
		return (
			<EmptyState
				icon={FolderOpenIcon}
				title="Project unavailable"
				description="The project could not be loaded."
			/>
		);
	}

	const { project, stats, recentSources, recentArtifacts } = projectQuery.data;

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div className="flex items-start gap-3">
						<span
							className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg"
							aria-hidden
						>
							{project.icon || "📁"}
						</span>
						<div>
							<div className="flex items-center gap-2">
								<CardTitle className="text-base">{project.name}</CardTitle>
								<StatusBadge
									status={stats.pendingSourceCount > 0 ? "pending" : "ready"}
								/>
							</div>
							<CardDescription className="mt-0.5">
								{project.description ||
									"No description yet. Add context in project settings."}
							</CardDescription>
						</div>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" asChild>
							<Link href={`/dashboard/projects/${projectId}/sources` as Route}>
								<PlusIcon data-icon="inline-start" />
								Add source
							</Link>
						</Button>
						<Button size="sm" asChild>
							<Link href={`/dashboard/projects/${projectId}/artifacts` as Route}>
								<SparklesIcon data-icon="inline-start" />
								Create artifact
							</Link>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="grid gap-x-6 gap-y-2 text-xs/relaxed text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
					<div>
						<p>Model</p>
						<p className="font-medium text-foreground">
							{project.defaultModelProvider} / {project.defaultModel}
						</p>
					</div>
					<div>
						<p>Indexing</p>
						<p className="font-medium text-foreground">
							{project.embeddingProvider} / {project.embeddingModel}
						</p>
					</div>
					<div>
						<p>Created</p>
						<p className="font-medium text-foreground">
							{formatDate(project.createdAt)}
						</p>
					</div>
					<div>
						<p>Last activity</p>
						<p className="font-medium text-foreground">
							{formatDate(project.updatedAt)}
						</p>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Sources"
					value={stats.sourceCount}
					description={`${stats.indexedSourceCount} ready for grounding`}
					icon={BookOpenIcon}
				/>
				<StatCard
					label="Pending"
					value={stats.pendingSourceCount}
					description="Upload complete, indexing outstanding"
					icon={ClockIcon}
				/>
				<StatCard
					label="Artifacts"
					value={stats.artifactCount}
					description="Saved outputs from project sources"
					icon={SparklesIcon}
				/>
				<StatCard
					label="Chunk profile"
					value={`${project.chunkSize}/${project.chunkOverlap}`}
					description="Size and overlap for source indexing"
					icon={LayersIcon}
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Recent sources</CardTitle>
						<CardDescription>Latest materials added to this workspace.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						{recentSources.length === 0 ? (
							<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
								<BookOpenIcon className="size-5 text-muted-foreground" />
								<p className="text-xs/relaxed text-muted-foreground">
									Upload a source to start grounding artifacts and future chat
									responses.
								</p>
							</div>
						) : (
							recentSources.map((item) => (
								<div
									key={item.id}
									className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
								>
									<div className="flex items-start gap-2.5">
										<FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">{item.title}</p>
											<p className="text-xs/relaxed text-muted-foreground">
												{item.type} · {item.chunkCount} chunks ·{" "}
												{formatDate(item.updatedAt)}
											</p>
										</div>
									</div>
									<StatusBadge status={item.status} />
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent artifacts</CardTitle>
						<CardDescription>Reusable outputs saved in this project.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						{recentArtifacts.length === 0 ? (
							<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
								<SparklesIcon className="size-5 text-muted-foreground" />
								<p className="text-xs/relaxed text-muted-foreground">
									Generate a summary, FAQ, or study guide from the artifact page.
								</p>
							</div>
						) : (
							recentArtifacts.map((item) => (
								<div
									key={item.id}
									className="rounded-lg border p-3 transition-colors hover:bg-muted/30"
								>
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2.5">
											<SparklesIcon className="size-4 shrink-0 text-muted-foreground" />
											<p className="text-sm font-medium">{item.title}</p>
										</div>
										<StatusBadge status="ready" />
									</div>
									<p className="mt-1 pl-6.5 text-xs/relaxed text-muted-foreground">
										{item.type} · {item.sourceCount} linked sources ·{" "}
										{formatDate(item.updatedAt)}
									</p>
									{item.sourceTitles.length > 0 ? (
										<p className="mt-0.5 pl-6.5 text-xs/relaxed text-muted-foreground">
											Based on: {item.sourceTitles.join(", ")}
										</p>
									) : null}
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
