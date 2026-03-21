"use client";

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@openbooklm/ui/components/empty";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { FileWarningIcon } from "lucide-react";
import { QueryErrorState, formatDate } from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function ArtifactDetailView({
	projectId,
	artifactId,
}: {
	projectId: string;
	artifactId: string;
}) {
	const artifactQuery = useQuery(trpc.artifacts.byId.queryOptions({ projectId, artifactId }));

	if (artifactQuery.isPending) {
		return (
			<div className="flex h-full min-h-0 flex-col gap-4">
				<Skeleton className="h-16 w-full rounded-xl" />
				<Skeleton className="h-full min-h-[32rem] w-full rounded-xl" />
			</div>
		);
	}

	if (artifactQuery.isError) {
		return (
			<QueryErrorState
				title="Artifact unavailable"
				description={artifactQuery.error.message}
				onRetry={() => void artifactQuery.refetch()}
			/>
		);
	}

	if (!artifactQuery.data) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileWarningIcon />
					</EmptyMedia>
					<EmptyTitle>Artifact not found</EmptyTitle>
					<EmptyDescription>
						This artifact may have been deleted or is no longer available.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const artifact = artifactQuery.data;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
			<div className="border-b px-6 py-5">
				<div className="flex flex-col gap-2">
					<h1 className="text-lg font-semibold tracking-tight">{artifact.title}</h1>
					<p className="text-sm text-muted-foreground">
						{artifact.type} · updated {formatDate(artifact.updatedAt)}
					</p>
					{artifact.sourceTitles.length ? (
						<p className="text-sm text-muted-foreground">
							Based on: {artifact.sourceTitles.join(", ")}
						</p>
					) : null}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto bg-background px-6 py-5">
				<pre className="font-mono text-sm leading-6 whitespace-pre-wrap break-words text-foreground">
					{artifact.content}
				</pre>
			</div>
		</div>
	);
}
