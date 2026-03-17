"use client";

import {
	FileTree,
	FileTreeActions,
	FileTreeFile,
	FileTreeFolder,
} from "@openbooklm/ui/components/ai-elements/file-tree";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@openbooklm/ui/components/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileTextIcon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

function TreeAction({
	icon: Icon,
	tooltip,
	onClick,
	variant = "ghost",
	disabled,
}: {
	icon: React.ComponentType<{ className?: string }>;
	tooltip: string;
	onClick: (e: React.MouseEvent) => void;
	variant?: "ghost" | "destructive";
	disabled?: boolean;
}) {
	return (
		<TooltipProvider delayDuration={300}>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						disabled={disabled}
						className={`inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-colors ${
							variant === "destructive"
								? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						} disabled:pointer-events-none disabled:opacity-50`}
						onClick={(e) => {
							e.stopPropagation();
							onClick(e);
						}}
					>
						<Icon className="size-3" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="right" className="text-xs">
					{tooltip}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

function AddItemRow({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button
			type="button"
			className="flex w-full cursor-pointer items-center gap-1 rounded px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			<span className="size-4 shrink-0" />
			<PlusIcon className="size-3.5 shrink-0" />
			<span className="truncate">{label}</span>
		</button>
	);
}

export function ProjectWorkspaceTree({
	projectId,
	projectName,
	onAddSource,
	onAddArtifact,
}: {
	projectId: string;
	projectName: string;
	onAddSource: () => void;
	onAddArtifact: () => void;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
	const base = `/dashboard/projects/${projectId}`;

	const sourcesQuery = useQuery(trpc.sources.list.queryOptions({ projectId }));
	const artifactsQuery = useQuery(trpc.artifacts.list.queryOptions({ projectId }));

	const selectedPath = useMemo(() => {
		if (pathname === base) return base;
		const sub = pathname.slice(base.length);
		if (sub.startsWith("/sources") || sub.startsWith("/files")) return `${base}/sources`;
		if (sub.startsWith("/artifacts")) return `${base}/artifacts`;
		return base;
	}, [pathname, base]);

	const defaultExpanded = useMemo(
		() => new Set([base, `${base}/sources`, `${base}/artifacts`]),
		[base],
	);

	const invalidateAll = async () => {
		await Promise.all([
			queryClient.invalidateQueries(trpc.sources.list.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.artifacts.list.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.byId.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.list.queryFilter()),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		]);
	};

	const deleteSourceMutation = useMutation(
		trpc.sources.delete.mutationOptions({
			onSuccess: async () => {
				await invalidateAll();
				toast.success("Source removed");
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const deleteArtifactMutation = useMutation(
		trpc.artifacts.delete.mutationOptions({
			onSuccess: async (_, variables) => {
				await queryClient.invalidateQueries(
					trpc.artifacts.byId.queryFilter({
						projectId,
						artifactId: variables.artifactId,
					}),
				);
				await invalidateAll();

				if (pathname.startsWith(`${base}/artifacts/${variables.artifactId}`)) {
					router.push(`${base}/artifacts` as Route);
				}

				toast.success("Artifact removed");
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const handleSelect = (path: string) => {
		router.push(path as Route);
	};

	return (
		<FileTree
			defaultExpanded={defaultExpanded}
			selectedPath={selectedPath}
			onSelect={handleSelect}
			className="border-none bg-transparent p-0 font-sans"
		>
			<FileTreeFolder path={base} name={projectName}>
				<FileTreeFolder path={`${base}/sources`} name="Sources">
					{sourcesQuery.data?.map((source) => (
						<FileTreeFile
							key={source.id}
							path={`${base}/sources#${source.id}`}
							name={source.title}
						>
							<span className="size-4 shrink-0" />
							<FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
							<span className="flex-1 truncate text-xs">{source.title}</span>
							<FileTreeActions>
								<TreeAction
									icon={Trash2Icon}
									tooltip="Remove source"
									variant="destructive"
									disabled={deleteSourceMutation.isPending}
									onClick={() =>
										deleteSourceMutation.mutate({
											projectId,
											sourceId: source.id,
										})
									}
								/>
							</FileTreeActions>
						</FileTreeFile>
					))}
					{sourcesQuery.isPending ? (
						<div className="py-1 pl-10 text-xs text-muted-foreground">Loading...</div>
					) : null}
					<AddItemRow label="Add source" onClick={onAddSource} />
				</FileTreeFolder>

				<FileTreeFolder path={`${base}/artifacts`} name="Artifacts">
					{artifactsQuery.data?.map((artifact) => (
						<FileTreeFile
							key={artifact.id}
							path={`${base}/artifacts/${artifact.id}`}
							name={artifact.title}
						>
							<span className="size-4 shrink-0" />
							<SparklesIcon className="size-4 shrink-0 text-muted-foreground" />
							<span className="flex-1 truncate text-xs">{artifact.title}</span>
							<FileTreeActions>
								<TreeAction
									icon={Trash2Icon}
									tooltip="Delete artifact"
									variant="destructive"
									disabled={deleteArtifactMutation.isPending}
									onClick={() =>
										deleteArtifactMutation.mutate({
											projectId,
											artifactId: artifact.id,
										})
									}
								/>
							</FileTreeActions>
						</FileTreeFile>
					))}
					{artifactsQuery.isPending ? (
						<div className="py-1 pl-10 text-xs text-muted-foreground">Loading...</div>
					) : null}
					<AddItemRow label="Create artifact" onClick={onAddArtifact} />
				</FileTreeFolder>
			</FileTreeFolder>
		</FileTree>
	);
}
