"use client";

import { SOURCE_TYPE_OPTIONS, sourceCreateSchema } from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import { Checkbox } from "@openbooklm/ui/components/checkbox";
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCwIcon, Trash2Icon } from "lucide-react";
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
import { trpc } from "@/utils/trpc";

export function SourcesManager({ projectId }: { projectId: string }) {
	const queryClient = useQueryClient();
	const sourcesQuery = useQuery(trpc.sources.list.queryOptions({ projectId }));

	const invalidateProjectData = async () => {
		await Promise.all([
			queryClient.invalidateQueries(trpc.sources.list.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.byId.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.list.queryFilter()),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		]);
	};

	const createSourceMutation = useMutation(
		trpc.sources.create.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Source saved");
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

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
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Sources</h1>
				<p className="text-sm text-muted-foreground">
					Add URLs, notes, markdown, or PDF placeholders and keep their indexing state in
					sync with the project overview.
				</p>
			</div>

			<div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
				<Card>
					<CardHeader>
						<CardTitle>Add source</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							noValidate
							className="space-y-4"
							onSubmit={(event) => {
								event.preventDefault();
								event.stopPropagation();
								form.handleSubmit();
							}}
						>
							<form.Field name="title">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Title</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="Paper, article, or note title"
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="type">
								{(field) => (
									<div className="space-y-2">
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
												<div className="space-y-2">
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
												<div className="space-y-2">
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
										<div className="space-y-1">
											<Label htmlFor={field.name}>
												Mark as ready for grounding
											</Label>
											<p className="text-xs/relaxed text-muted-foreground">
												When enabled, the source is immediately counted as
												indexed.
											</p>
										</div>
									</div>
								)}
							</form.Field>

							<form.Subscribe
								selector={(state) => ({
									canSubmit: state.canSubmit,
									isSubmitting: state.isSubmitting,
								})}
							>
								{({ canSubmit, isSubmitting }) => (
									<Button
										type="submit"
										className="w-full"
										disabled={
											!canSubmit ||
											isSubmitting ||
											createSourceMutation.isPending
										}
									>
										{isSubmitting || createSourceMutation.isPending
											? "Saving..."
											: "Save source"}
									</Button>
								)}
							</form.Subscribe>
						</form>
					</CardContent>
				</Card>

				<div className="space-y-4">
					{sourcesQuery.isPending ? (
						Array.from({ length: 3 }).map((_, index) => (
							<Card key={index}>
								<CardHeader className="space-y-2">
									<div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
									<div className="h-3 w-64 animate-pulse rounded-md bg-muted" />
								</CardHeader>
							</Card>
						))
					) : sourcesQuery.isError ? (
						<QueryErrorState
							title="Sources unavailable"
							description={sourcesQuery.error.message}
							onRetry={() => void sourcesQuery.refetch()}
						/>
					) : sourcesQuery.data?.length ? (
						sourcesQuery.data.map((item) => (
							<Card key={item.id}>
								<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div>
										<div className="flex items-center gap-2">
											<CardTitle>{item.title}</CardTitle>
											<StatusBadge status={item.status} />
										</div>
										<p className="mt-1 text-xs/relaxed text-muted-foreground">
											{item.type} · {formatBytes(item.contentBytes)} · updated{" "}
											{formatDate(item.updatedAt)}
										</p>
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
											<RefreshCwIcon />
											Re-index
										</Button>
										<Button
											variant="destructive"
											size="sm"
											disabled={deleteSourceMutation.isPending}
											onClick={() =>
												deleteSourceMutation.mutate({
													projectId,
													sourceId: item.id,
												})
											}
										>
											<Trash2Icon />
											Remove
										</Button>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="text-sm text-muted-foreground">
										{item.excerpt || "No preview content saved yet."}
									</p>
									<div className="grid gap-2 text-xs/relaxed text-muted-foreground sm:grid-cols-3">
										<p>Pages: {item.pageCount}</p>
										<p>Chunks: {item.chunkCount}</p>
										<p>Created: {formatDate(item.createdAt)}</p>
									</div>
								</CardContent>
							</Card>
						))
					) : (
						<EmptyState
							title="No sources yet"
							description="Add a source on the left to populate the project knowledge base."
						/>
					)}
				</div>
			</div>
		</div>
	);
}
