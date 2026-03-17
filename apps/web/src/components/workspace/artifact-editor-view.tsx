"use client";

import { ArtifactEditor } from "@openbooklm/ui/components/artifact-editor";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@openbooklm/ui/components/empty";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileWarningIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { QueryErrorState, formatDate } from "@/components/workspace/primitives";
import { useArtifactInvalidation } from "@/lib/invalidation";
import { trpc } from "@/utils/trpc";

export function ArtifactEditorView({
	projectId,
	artifactId,
}: {
	projectId: string;
	artifactId: string;
}) {
	const artifactQuery = useQuery(trpc.artifacts.byId.queryOptions({ projectId, artifactId }));
	const invalidateArtifactData = useArtifactInvalidation(projectId, artifactId);
	const queryClient = useQueryClient();
	const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

	const updateArtifactMutation = useMutation(trpc.artifacts.update.mutationOptions());

	useEffect(() => {
		setLastSavedAt(artifactQuery.data?.updatedAt ?? null);
	}, [artifactQuery.data?.updatedAt]);

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
		<div className="flex h-full min-h-0 flex-col">
			<ArtifactEditor
				key={artifact.id}
				title={artifact.title}
				content={artifact.content}
				contentJson={artifact.contentJson}
				updatedAtLabel={
					lastSavedAt ? formatDate(lastSavedAt) : formatDate(artifact.updatedAt)
				}
				onSave={async (payload) => {
					const result = await updateArtifactMutation.mutateAsync({
						projectId,
						artifactId,
						title: payload.title,
						content: payload.content,
						contentJson: payload.contentJson,
					});

					queryClient.setQueryData(
						trpc.artifacts.byId.queryKey({ projectId, artifactId }),
						(current) => {
							if (!current) {
								return current;
							}

							return {
								...current,
								title: payload.title,
								content: payload.content,
								contentJson: payload.contentJson,
								contentPreview:
									payload.content.length > 180
										? `${payload.content.slice(0, 177)}...`
										: payload.content,
								updatedAt: result.updatedAt,
							};
						},
					);

					setLastSavedAt(result.updatedAt);
					await invalidateArtifactData();
				}}
			/>
		</div>
	);
}
