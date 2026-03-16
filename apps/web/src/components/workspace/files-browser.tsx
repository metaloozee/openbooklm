"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@openbooklm/ui/components/empty";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, FilesIcon, FolderIcon } from "lucide-react";

import {
	QueryErrorState,
	StatusBadge,
	formatBytes,
	formatDate,
} from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function FilesBrowser({ projectId }: { projectId: string }) {
	const filesQuery = useQuery(trpc.files.list.queryOptions({ projectId }));

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Files</h1>
				<p className="text-sm text-muted-foreground">
					A virtual file-system view of your saved sources and artifacts.
				</p>
			</div>

			{filesQuery.isPending ? (
				<div className="flex flex-col gap-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			) : filesQuery.isError ? (
				<QueryErrorState
					title="Files unavailable"
					description={filesQuery.error.message}
					onRetry={() => void filesQuery.refetch()}
				/>
			) : !filesQuery.data?.items.length ? (
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant={"icon"}>
							<FilesIcon />
						</EmptyMedia>
						<EmptyTitle>No virtual files yet</EmptyTitle>
						<EmptyDescription>
							Files appear here as soon as the project has sources or artifacts.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
					<Card>
						<CardHeader>
							<CardTitle>Folders</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							{filesQuery.data.folders.map((folder) => (
								<div
									key={folder.path}
									className="flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/30"
								>
									<div className="flex items-center gap-2.5">
										<FolderIcon className="size-4 text-muted-foreground" />
										<div>
											<p className="text-xs font-medium">{folder.label}</p>
											<p className="text-xs/relaxed text-muted-foreground">
												{folder.path}
											</p>
										</div>
									</div>
									<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
										{folder.itemCount}
									</span>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Virtual file list</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-1.5">
							{filesQuery.data.items.map((item) => (
								<div
									key={item.id}
									className="grid items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,1fr)_80px_auto_140px]"
								>
									<div className="flex min-w-0 items-center gap-2.5">
										<FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
										<div className="min-w-0">
											<p className="truncate text-xs font-medium">
												{item.title}
											</p>
											<p className="truncate text-xs/relaxed text-muted-foreground">
												{item.path}
											</p>
										</div>
									</div>
									<span className="text-xs/relaxed text-muted-foreground">
										{item.type}
									</span>
									<StatusBadge status={item.status} />
									<div className="text-xs/relaxed tabular-nums text-muted-foreground">
										<p>{formatBytes(item.sizeBytes)}</p>
										<p>{formatDate(item.updatedAt)}</p>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
