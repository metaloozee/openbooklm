"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, FolderIcon } from "lucide-react";

import {
	EmptyState,
	StatusBadge,
	formatBytes,
	formatDate,
} from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function FilesBrowser({ projectId }: { projectId: string }) {
	const filesQuery = useQuery(trpc.files.list.queryOptions({ projectId }));

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Files</h1>
				<p className="text-sm text-muted-foreground">
					A virtual file-system view of your saved sources and artifacts.
				</p>
			</div>

			{filesQuery.isPending ? (
				<Skeleton className="h-80 w-full" />
			) : !filesQuery.data?.items.length ? (
				<EmptyState
					title="No virtual files yet"
					description="Files appear here as soon as the project has sources or artifacts."
				/>
			) : (
				<div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
					<Card>
						<CardHeader>
							<CardTitle>Folders</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{filesQuery.data.folders.map((folder) => (
								<div
									key={folder.path}
									className="flex items-center justify-between rounded-md border p-3"
								>
									<div className="flex items-center gap-2">
										<FolderIcon className="size-4 text-muted-foreground" />
										<div>
											<p className="font-medium">{folder.label}</p>
											<p className="text-xs/relaxed text-muted-foreground">
												{folder.path}
											</p>
										</div>
									</div>
									<p className="text-xs/relaxed text-muted-foreground">
										{folder.itemCount}
									</p>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Virtual file list</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{filesQuery.data.items.map((item) => (
								<div
									key={item.id}
									className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_120px_100px_150px]"
								>
									<div className="flex min-w-0 items-start gap-2">
										<FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
										<div className="min-w-0">
											<p className="truncate font-medium">{item.title}</p>
											<p className="truncate text-xs/relaxed text-muted-foreground">
												{item.path}
											</p>
										</div>
									</div>
									<p className="text-xs/relaxed text-muted-foreground">
										{item.type}
									</p>
									<StatusBadge status={item.status} />
									<div className="text-xs/relaxed text-muted-foreground">
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
