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
import dynamic from "next/dynamic";
import { QueryErrorState } from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

const ArtifactDocumentEditor = dynamic(
	() =>
		import("@/components/workspace/artifact-document-editor").then(
			(module) => module.ArtifactDocumentEditor,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-full min-h-[32rem] w-full rounded-md" />,
	},
);

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
		<ArtifactDocumentEditor
			key={artifact.id}
			projectId={artifact.projectId}
			artifactId={artifact.id}
			initialText={artifact.content}
			initialContentJson={artifact.contentJson}
		/>
	);
}
