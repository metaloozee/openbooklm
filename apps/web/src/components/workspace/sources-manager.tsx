"use client";

import { SOURCE_TYPE_OPTIONS, sourceCreateSchema } from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import { Checkbox } from "@openbooklm/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@openbooklm/ui/components/dialog";
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { Spinner } from "@openbooklm/ui/components/spinner";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpenIcon, FileTextIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	EmptyState,
	FieldErrors,
	NativeSelect,
	QueryErrorState,
	StatusBadge,
	formatBytes,
	formatDate,
} from "@/components/workspace/primitives";
import { useSourceInvalidation } from "@/lib/invalidation";
import { trpc } from "@/utils/trpc";

export function AddSourceDialog({
	projectId,
	open,
	onOpenChange,
}: {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const invalidateProjectData = useSourceInvalidation(projectId);

	const createSourceMutation = useMutation(
		trpc.sources.create.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Source saved");
				form.reset();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			projectId,
			title: "",
			type: "text" as (typeof SOURCE_TYPE_OPTIONS)[number],
			url: "",
			content: "",
			indexNow: true,
		},
		validators: {
			onSubmit: sourceCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createSourceMutation.mutateAsync(value);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add source</DialogTitle>
					<DialogDescription>
						Add a URL, note, markdown, or PDF placeholder to the project knowledge base.
					</DialogDescription>
				</DialogHeader>
				<form
					noValidate
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.Field name="title">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={field.name}>Title</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Paper, article, or note title"
								/>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field name="type">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={field.name}>Type</Label>
								<NativeSelect
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(
											event.target
												.value as (typeof SOURCE_TYPE_OPTIONS)[number],
										)
									}
								>
									{SOURCE_TYPE_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</NativeSelect>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => state.values.type}>
						{(type) =>
							type === "url" ? (
								<form.Field name="url">
									{(field) => (
										<div className="flex flex-col gap-1.5">
											<Label htmlFor={field.name}>URL</Label>
											<Input
												id={field.name}
												name={field.name}
												type="url"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												placeholder="https://example.com/article"
											/>
											<FieldErrors errors={field.state.meta.errors} />
										</div>
									)}
								</form.Field>
							) : (
								<form.Field name="content">
									{(field) => (
										<div className="flex flex-col gap-1.5">
											<Label htmlFor={field.name}>
												{type === "pdf" ? "Notes" : "Content"}
											</Label>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												placeholder={
													type === "pdf"
														? "Optional notes or extracted text placeholder."
														: "Paste the source body you want indexed."
												}
												className="min-h-28 resize-none"
											/>
											<FieldErrors errors={field.state.meta.errors} />
										</div>
									)}
								</form.Field>
							)
						}
					</form.Subscribe>

					<form.Field name="indexNow">
						{(field) => (
							<div className="flex items-start gap-3 rounded-md border p-3">
								<Checkbox
									id={field.name}
									checked={field.state.value}
									onCheckedChange={(checked) =>
										field.handleChange(Boolean(checked))
									}
								/>
								<div className="flex flex-col gap-0.5">
									<Label htmlFor={field.name}>Mark as ready for grounding</Label>
									<p className="text-xs/relaxed text-muted-foreground">
										The source is immediately counted as indexed.
									</p>
								</div>
							</div>
						)}
					</form.Field>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<>
									<Button
										type="button"
										variant="outline"
										onClick={() => onOpenChange(false)}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={
											!canSubmit ||
											isSubmitting ||
											createSourceMutation.isPending
										}
									>
										{isSubmitting || createSourceMutation.isPending ? (
											<>
												<Spinner data-icon="inline-start" />
												Saving...
											</>
										) : (
											<>
												<PlusIcon data-icon="inline-start" />
												Save source
											</>
										)}
									</Button>
								</>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function SourcesManager({ projectId }: { projectId: string }) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const sourcesQuery = useQuery(trpc.sources.list.queryOptions({ projectId }));
	const invalidateProjectData = useSourceInvalidation(projectId);

	const reindexSourceMutation = useMutation(
		trpc.sources.reindex.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Source marked as indexed");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const deleteSourceMutation = useMutation(
		trpc.sources.delete.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Source removed");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-lg font-semibold tracking-tight">Sources</h1>
					<p className="text-sm text-muted-foreground">
						Add URLs, notes, markdown, or PDF placeholders and manage their indexing
						state.
					</p>
				</div>
				<Button onClick={() => setIsAddOpen(true)}>
					<PlusIcon data-icon="inline-start" />
					Add source
				</Button>
			</div>

			{sourcesQuery.isPending ? (
				<div className="flex flex-col gap-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className="flex flex-col gap-3">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-3.5 w-64" />
							</CardHeader>
						</Card>
					))}
				</div>
			) : sourcesQuery.isError ? (
				<QueryErrorState
					title="Sources unavailable"
					description={sourcesQuery.error.message}
					onRetry={() => void sourcesQuery.refetch()}
				/>
			) : sourcesQuery.data?.length ? (
				<div className="flex flex-col gap-3">
					{sourcesQuery.data.map((item) => (
						<Card
							key={item.id}
							className="transition-colors hover:border-foreground/20"
						>
							<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
								<div className="flex items-start gap-3">
									<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
										<FileTextIcon className="size-4 text-muted-foreground" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<CardTitle>{item.title}</CardTitle>
											<StatusBadge status={item.status} />
										</div>
										<p className="mt-0.5 text-xs/relaxed text-muted-foreground">
											{item.type} · {formatBytes(item.contentBytes)} · updated{" "}
											{formatDate(item.updatedAt)}
										</p>
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={reindexSourceMutation.isPending}
										onClick={() =>
											reindexSourceMutation.mutate({
												projectId,
												sourceId: item.id,
											})
										}
									>
										<RefreshCwIcon data-icon="inline-start" />
										Re-index
									</Button>
									<Button
										variant="destructive"
										size="sm"
										disabled={deleteSourceMutation.isPending}
										onClick={() => {
											if (
												window.confirm(
													`Remove "${item.title}"? This is irreversible and may delete indexed data.`,
												)
											) {
												deleteSourceMutation.mutate({
													projectId,
													sourceId: item.id,
												});
											}
										}}
									>
										<Trash2Icon data-icon="inline-start" />
										Remove
									</Button>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								<p className="text-sm text-muted-foreground line-clamp-2">
									{item.excerpt || "No preview content saved yet."}
								</p>
								<div className="flex flex-wrap gap-x-6 gap-y-1 text-xs/relaxed text-muted-foreground">
									<span>Pages: {item.pageCount}</span>
									<span>Chunks: {item.chunkCount}</span>
									<span>Created: {formatDate(item.createdAt)}</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<EmptyState
					icon={BookOpenIcon}
					title="No sources yet"
					description="Add a source to populate the project knowledge base and enable grounded conversations."
					action={
						<Button onClick={() => setIsAddOpen(true)}>
							<PlusIcon data-icon="inline-start" />
							Add source
						</Button>
					}
				/>
			)}

			<AddSourceDialog projectId={projectId} open={isAddOpen} onOpenChange={setIsAddOpen} />
		</div>
	);
}
