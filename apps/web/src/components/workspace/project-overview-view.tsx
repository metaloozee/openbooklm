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
import Link from "next/link";

import {
	EmptyState,
	StatCard,
	StatusBadge,
	formatDate,
} from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function ProjectOverviewView({ projectId }: { projectId: string }) {
	const projectQuery = useQuery(trpc.projects.byId.queryOptions({ projectId }));

	if (projectQuery.isPending) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-16 w-full" />
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} className="h-28 w-full" />
					))}
				</div>
				<Skeleton className="h-72 w-full" />
			</div>
		);
	}

	if (!projectQuery.data) {
		return (
			<EmptyState
				title="Project unavailable"
				description="The project could not be loaded."
			/>
		);
	}

	const { project, stats, recentSources, recentArtifacts } = projectQuery.data;

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<div className="flex items-center gap-2">
							<CardTitle>{project.name}</CardTitle>
							<StatusBadge
								status={stats.pendingSourceCount > 0 ? "pending" : "ready"}
							/>
						</div>
						<CardDescription className="mt-1">
							{project.description || "No description yet. Add context in project settings."}
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" asChild>
							<Link href={`/dashboard/projects/${projectId}/sources`}>Add source</Link>
						</Button>
						<Button asChild>
							<Link href={`/dashboard/projects/${projectId}/artifacts`}>Create artifact</Link>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="grid gap-2 text-xs/relaxed text-muted-foreground sm:grid-cols-2">
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
						<p className="font-medium text-foreground">{formatDate(project.createdAt)}</p>
					</div>
					<div>
						<p>Last activity</p>
						<p className="font-medium text-foreground">{formatDate(project.updatedAt)}</p>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Sources"
					value={stats.sourceCount}
					description={`${stats.indexedSourceCount} ready for grounding`}
				/>
				<StatCard
					label="Pending sources"
					value={stats.pendingSourceCount}
					description="Upload complete, indexing outstanding"
				/>
				<StatCard
					label="Artifacts"
					value={stats.artifactCount}
					description="Saved outputs derived from project sources"
				/>
				<StatCard
					label="Chunk profile"
					value={`${project.chunkSize}/${project.chunkOverlap}`}
					description="Chunk size and overlap for source indexing"
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Recent sources</CardTitle>
						<CardDescription>Latest materials added to this workspace.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{recentSources.length === 0 ? (
							<EmptyState
								title="No sources yet"
								description="Upload a source to start grounding artifacts and future chat responses."
							/>
						) : (
							recentSources.map((item) => (
								<div
									key={item.id}
									className="flex items-start justify-between gap-3 rounded-md border p-3"
								>
									<div>
										<p className="font-medium">{item.title}</p>
										<p className="text-xs/relaxed text-muted-foreground">
											{item.type} · {item.chunkCount} chunks · updated {formatDate(item.updatedAt)}
										</p>
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
					<CardContent className="space-y-3">
						{recentArtifacts.length === 0 ? (
							<EmptyState
								title="No artifacts yet"
								description="Generate a summary, FAQ, or study guide from the artifact page."
							/>
						) : (
							recentArtifacts.map((item) => (
								<div
									key={item.id}
									className="rounded-md border p-3"
								>
									<div className="flex items-center justify-between gap-3">
										<p className="font-medium">{item.title}</p>
										<StatusBadge status="ready" />
									</div>
									<p className="text-xs/relaxed text-muted-foreground">
										{item.type} · {item.sourceCount} linked sources · updated{" "}
										{formatDate(item.updatedAt)}
									</p>
									{item.sourceTitles.length > 0 ? (
										<p className="mt-1 text-xs/relaxed text-muted-foreground">
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
