"use client";

import {
	ARTIFACT_TYPE_OPTIONS,
	artifactCreateSchema,
} from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import { Checkbox } from "@openbooklm/ui/components/checkbox";
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
	EmptyState,
	FieldErrors,
	NativeSelect,
	StatusBadge,
	formatDate,
} from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function ArtifactsManager({ projectId }: { projectId: string }) {
	const queryClient = useQueryClient();
	const artifactsQuery = useQuery(trpc.artifacts.list.queryOptions({ projectId }));
	const sourcesQuery = useQuery(trpc.sources.list.queryOptions({ projectId }));

	const invalidateProjectData = async () => {
		await Promise.all([
			queryClient.invalidateQueries(trpc.artifacts.list.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.byId.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.list.queryFilter()),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		]);
	};

	const createArtifactMutation = useMutation(
		trpc.artifacts.create.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Artifact created");
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

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

	const form = useForm({
		defaultValues: {
			projectId,
			title: "",
			type: "summary" as const,
			content: "",
			sourceIds: [] as string[],
		},
		validators: {
			onSubmit: artifactCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createArtifactMutation.mutateAsync(value);
		},
	});

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Artifacts</h1>
				<p className="text-sm text-muted-foreground">
					Save structured outputs from your sources while the AI generation layer is still
					being built.
				</p>
			</div>

			<div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
				<Card>
					<CardHeader>
						<CardTitle>Create artifact</CardTitle>
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
											onChange={(event) => field.handleChange(event.target.value)}
											placeholder="Executive summary"
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
													event.target.value as (typeof ARTIFACT_TYPE_OPTIONS)[number],
												)
											}
										>
											{ARTIFACT_TYPE_OPTIONS.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</NativeSelect>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="content">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Content</Label>
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
											placeholder="Write the artifact body, notes, or generated content."
											className="min-h-40"
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="sourceIds">
								{(field) => (
									<div className="space-y-2">
										<Label>Linked sources</Label>
										<div className="space-y-2 rounded-md border p-3">
											{sourcesQuery.data?.length ? (
												sourcesQuery.data.map((item) => {
													const checked = field.state.value.includes(item.id);
													return (
														<label
															key={item.id}
															className="flex items-start gap-3 rounded-md border p-2"
														>
															<Checkbox
																checked={checked}
																onCheckedChange={(nextChecked) => {
																	field.handleChange(
																		Boolean(nextChecked)
																			? [...field.state.value, item.id]
																			: field.state.value.filter((value) => value !== item.id),
																	);
																}}
															/>
															<div>
																<p className="font-medium">{item.title}</p>
																<p className="text-xs/relaxed text-muted-foreground">
																	{item.type} · {item.status}
																</p>
															</div>
														</label>
													);
												})
											) : (
												<p className="text-xs/relaxed text-muted-foreground">
													Add sources first to link provenance to artifacts.
												</p>
											)}
										</div>
										<FieldErrors errors={field.state.meta.errors} />
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
										disabled={!canSubmit || isSubmitting || createArtifactMutation.isPending}
									>
										{isSubmitting || createArtifactMutation.isPending
											? "Saving..."
											: "Save artifact"}
									</Button>
								)}
							</form.Subscribe>
						</form>
					</CardContent>
				</Card>

				<div className="space-y-4">
					{artifactsQuery.data?.length ? (
						artifactsQuery.data.map((item) => (
							<Card key={item.id}>
								<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div>
										<div className="flex items-center gap-2">
											<CardTitle>{item.title}</CardTitle>
											<StatusBadge status="ready" />
										</div>
										<p className="mt-1 text-xs/relaxed text-muted-foreground">
											{item.type} · updated {formatDate(item.updatedAt)}
										</p>
									</div>
									<Button
										variant="destructive"
										size="sm"
										disabled={deleteArtifactMutation.isPending}
										onClick={() =>
											deleteArtifactMutation.mutate({
												projectId,
												artifactId: item.id,
											})
										}
									>
										<Trash2Icon />
										Delete
									</Button>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="text-sm text-muted-foreground">{item.contentPreview}</p>
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
						))
					) : (
						<EmptyState
							title="No artifacts yet"
							description="Create a summary, FAQ, study guide, or report once the source set is ready."
						/>
					)}
				</div>
			</div>
		</div>
	);
}
