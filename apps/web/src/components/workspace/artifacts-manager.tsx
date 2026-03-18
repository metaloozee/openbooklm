"use client";

import { ARTIFACT_TYPE_OPTIONS, artifactCreateSchema } from "@openbooklm/api/contracts";
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
import { PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
	FieldErrors,
	Select,
	QueryErrorState,
	StatusBadge,
	formatDate,
} from "@/components/workspace/primitives";
import { useArtifactInvalidation } from "@/lib/invalidation";
import { trpc } from "@/utils/trpc";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "@openbooklm/ui/components/empty";

export function CreateArtifactDialog({
	projectId,
	open,
	onOpenChange,
}: {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const sourcesQuery = useQuery(trpc.sources.list.queryOptions({ projectId }));
	const invalidateProjectData = useArtifactInvalidation(projectId);
	const sourceOptions = useMemo(
		() =>
			(sourcesQuery.data ?? []).map((item) => ({
				id: item.id,
				title: item.title,
			})),
		[sourcesQuery.data],
	);

	const createArtifactMutation = useMutation(
		trpc.artifacts.create.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Artifact created");
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
			type: "summary" as (typeof ARTIFACT_TYPE_OPTIONS)[number],
			instructions: "",
			sourceIds: [] as string[],
		},
		validators: {
			onSubmit: artifactCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createArtifactMutation.mutateAsync(value);
		},
	});

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			form.reset();
		}

		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<div className="flex flex-col gap-4">
					<DialogHeader>
						<DialogTitle>Create artifact</DialogTitle>
						<DialogDescription>
							Create an AI-generated artifact from selected sources and optional
							instructions.
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
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="title">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Title</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="Executive summary"
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="type">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Type</Label>
										<Select
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(
													event.target
														.value as (typeof ARTIFACT_TYPE_OPTIONS)[number],
												)
											}
										>
											{ARTIFACT_TYPE_OPTIONS.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</Select>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="sourceIds">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label>Linked sources</Label>
									{sourcesQuery.isPending ? (
										<p className="rounded-md border px-3 py-2 text-xs/relaxed text-muted-foreground">
											Loading sources...
										</p>
									) : sourcesQuery.isError ? (
										<div className="flex flex-col gap-2 rounded-md border border-dashed p-3 text-xs/relaxed text-destructive">
											<p>{sourcesQuery.error.message}</p>
											<Button
												variant="outline"
												size="sm"
												onClick={() => void sourcesQuery.refetch()}
											>
												Retry
											</Button>
										</div>
									) : sourceOptions.length ? (
										<div className="rounded-md border">
											<div className="border-b px-3 py-2 text-xs/relaxed text-muted-foreground">
												{field.state.value?.length
													? `${field.state.value.length} source${field.state.value.length === 1 ? "" : "s"} selected`
													: "Select one or more sources to link provenance to this artifact."}
											</div>
											<div className="max-h-48 space-y-2 overflow-y-auto p-3">
												{sourceOptions.map((source) => {
													const checked =
														field.state.value?.includes(source.id) ??
														false;

													return (
														<label
															key={source.id}
															className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/30"
														>
															<Checkbox
																checked={checked}
																onCheckedChange={(nextChecked) => {
																	const currentValue =
																		field.state.value ?? [];
																	field.handleChange(
																		nextChecked
																			? [
																					...currentValue,
																					source.id,
																				]
																			: currentValue.filter(
																					(sourceId) =>
																						sourceId !==
																						source.id,
																				),
																	);
																}}
															/>
															<div className="min-w-0">
																<p className="truncate text-xs font-medium">
																	{source.title}
																</p>
																<p className="text-xs/relaxed text-muted-foreground">
																	{source.id}
																</p>
															</div>
														</label>
													);
												})}
											</div>
										</div>
									) : (
										<p className="rounded-md border px-3 py-2 text-xs/relaxed text-muted-foreground">
											Add sources first to link provenance to artifacts.
										</p>
									)}
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="instructions">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>Instructions (optional)</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Suggest tone, focus areas, structure, or constraints for generation."
										className="min-h-32 resize-none"
									/>
									<FieldErrors errors={field.state.meta.errors} />
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
											onClick={() => handleOpenChange(false)}
										>
											Cancel
										</Button>
										<Button
											type="submit"
											disabled={
												!canSubmit ||
												isSubmitting ||
												createArtifactMutation.isPending
											}
											size="default"
											aria-busy={
												isSubmitting || createArtifactMutation.isPending
											}
											className="min-w-28"
										>
											<span className="inline-flex items-center justify-center gap-1">
												{isSubmitting ||
												createArtifactMutation.isPending ? (
													<Spinner />
												) : null}
												<span>Save artifact</span>
											</span>
										</Button>
									</>
								)}
							</form.Subscribe>
						</DialogFooter>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function ArtifactsManager({ projectId }: { projectId: string }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const artifactsQuery = useQuery(trpc.artifacts.list.queryOptions({ projectId }));
	const invalidateProjectData = useArtifactInvalidation(projectId);

	const deleteArtifactMutation = useMutation(
		trpc.artifacts.delete.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Artifact removed");
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
					<h1 className="text-lg font-semibold tracking-tight">Artifacts</h1>
					<p className="text-sm text-muted-foreground">
						Save structured outputs from your sources while the AI generation layer is
						still being built.
					</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<PlusIcon data-icon="inline-start" />
					Create artifact
				</Button>
			</div>

			{artifactsQuery.isPending ? (
				<div className="flex flex-col gap-3">
					{Array.from({ length: 2 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className="flex flex-col gap-3">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-3.5 w-56" />
							</CardHeader>
						</Card>
					))}
				</div>
			) : artifactsQuery.isError ? (
				<QueryErrorState
					title="Artifacts unavailable"
					description={artifactsQuery.error.message}
					onRetry={() => void artifactsQuery.refetch()}
				/>
			) : artifactsQuery.data?.length ? (
				<div className="flex flex-col gap-3">
					{artifactsQuery.data.map((item) => (
						<Card
							key={item.id}
							className="transition-colors hover:border-foreground/20"
						>
							<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
								<div className="flex items-start gap-3">
									<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
										<SparklesIcon className="size-4 text-muted-foreground" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<CardTitle>
												<Link
													href={
														`/dashboard/projects/${projectId}/artifacts/${item.id}` as Route
													}
													className="transition-colors hover:text-primary"
												>
													{item.title}
												</Link>
											</CardTitle>
											<StatusBadge status="ready" />
										</div>
										<p className="mt-0.5 text-xs/relaxed text-muted-foreground">
											{item.type} · updated {formatDate(item.updatedAt)}
										</p>
									</div>
								</div>
								<Button
									variant="destructive"
									size="sm"
									disabled={deleteArtifactMutation.isPending}
									onClick={() => {
										if (
											window.confirm(
												`Delete "${item.title}"? This is irreversible.`,
											)
										) {
											deleteArtifactMutation.mutate({
												projectId,
												artifactId: item.id,
											});
										}
									}}
								>
									<Trash2Icon data-icon="inline-start" />
									Delete
								</Button>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								<p className="text-sm text-muted-foreground line-clamp-2">
									{item.contentPreview}
								</p>
								{item.sourceTitles.length ? (
									<p className="text-xs/relaxed text-muted-foreground">
										Based on: {item.sourceTitles.join(", ")}
									</p>
								) : (
									<p className="text-xs/relaxed text-muted-foreground">
										No linked sources yet.
									</p>
								)}
								<p className="text-xs/relaxed text-muted-foreground">
									Created {formatDate(item.createdAt)}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant={"icon"}>
							<SparklesIcon />
						</EmptyMedia>
						<EmptyTitle>No artifacts yet</EmptyTitle>
						<EmptyDescription>
							Create a summary, FAQ, study guide, or report once the source set is
							ready.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}

			<CreateArtifactDialog
				projectId={projectId}
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>
		</div>
	);
}
