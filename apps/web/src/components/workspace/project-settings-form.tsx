"use client";

import {
	MODEL_PROVIDER_OPTIONS,
	PROJECT_VISIBILITY_OPTIONS,
	projectUpdateSchema,
} from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import { Checkbox } from "@openbooklm/ui/components/checkbox";
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState, FieldErrors, NativeSelect } from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

function ProjectSettingsFormInner({
	projectId,
	project,
}: {
	projectId: string;
	project: {
		project: {
			id: string;
			name: string;
			description: string;
			icon: string | null;
			visibility: "private" | "shared";
			defaultModelProvider: "openai" | "anthropic" | "google" | "ollama";
			defaultModel: string;
			embeddingProvider: "openai" | "anthropic" | "google" | "ollama";
			embeddingModel: string;
			chunkSize: number;
			chunkOverlap: number;
			refreshOnSourceChange: boolean;
		};
	};
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const invalidateProjectData = async () => {
		await Promise.all([
			queryClient.invalidateQueries(trpc.projects.byId.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.list.queryFilter()),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		]);
	};

	const updateProjectMutation = useMutation(
		trpc.projects.update.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Project settings saved");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const deleteProjectMutation = useMutation(
		trpc.projects.delete.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries(trpc.projects.list.queryFilter());
				queryClient.removeQueries(trpc.projects.byId.queryFilter({ projectId }));
				toast.success("Project deleted");
				router.push("/dashboard");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			projectId,
			name: project.project.name,
			description: project.project.description,
			icon: project.project.icon ?? "",
			visibility: project.project.visibility,
			defaultModelProvider: project.project.defaultModelProvider,
			defaultModel: project.project.defaultModel,
			embeddingProvider: project.project.embeddingProvider,
			embeddingModel: project.project.embeddingModel,
			chunkSize: project.project.chunkSize,
			chunkOverlap: project.project.chunkOverlap,
			refreshOnSourceChange: project.project.refreshOnSourceChange,
		},
		validators: {
			onSubmit: projectUpdateSchema,
		},
		onSubmit: async ({ value }) => {
			await updateProjectMutation.mutateAsync(value);
		},
	});

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Project Settings</h1>
				<p className="text-sm text-muted-foreground">
					Control the project metadata, model defaults, and indexing profile used across
					the workspace.
				</p>
			</div>

			<form
				noValidate
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle>General</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-[1fr_120px]">
							<form.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Name</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
							<form.Field name="icon">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Icon</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="description">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Description</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="visibility">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Visibility</Label>
									<NativeSelect
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) =>
											field.handleChange(
												event.target.value as (typeof PROJECT_VISIBILITY_OPTIONS)[number],
											)
										}
									>
										{PROJECT_VISIBILITY_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</NativeSelect>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Model defaults</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						<form.Field name="defaultModelProvider">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Default provider</Label>
									<NativeSelect
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) =>
											field.handleChange(
												event.target.value as (typeof MODEL_PROVIDER_OPTIONS)[number],
											)
										}
									>
										{MODEL_PROVIDER_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</NativeSelect>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="defaultModel">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Default model</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Indexing</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="embeddingProvider">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Embedding provider</Label>
										<NativeSelect
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(
													event.target.value as (typeof MODEL_PROVIDER_OPTIONS)[number],
												)
											}
										>
											{MODEL_PROVIDER_OPTIONS.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</NativeSelect>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="embeddingModel">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Embedding model</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="chunkSize">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Chunk size</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={String(field.state.value)}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(Number(event.target.value))}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="chunkOverlap">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Chunk overlap</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={String(field.state.value)}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(Number(event.target.value))}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="refreshOnSourceChange">
							{(field) => (
								<div className="flex items-start gap-3 rounded-md border p-3">
									<Checkbox
										id={field.name}
										checked={field.state.value}
										onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
									/>
									<div className="space-y-1">
										<Label htmlFor={field.name}>Refresh index automatically</Label>
										<p className="text-xs/relaxed text-muted-foreground">
											Keep the project index current when sources are added or updated.
										</p>
									</div>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<div className="flex justify-end">
					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button
								type="submit"
								disabled={!canSubmit || isSubmitting || updateProjectMutation.isPending}
							>
								{isSubmitting || updateProjectMutation.isPending ? "Saving..." : "Save changes"}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>

			<Card className="border-destructive/20">
				<CardHeader>
					<CardTitle>Danger zone</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="font-medium">Delete project</p>
						<p className="text-xs/relaxed text-muted-foreground">
							This removes the workspace and all related sources and artifacts.
						</p>
					</div>
					<Button
						variant="destructive"
						disabled={deleteProjectMutation.isPending}
						onClick={() => deleteProjectMutation.mutate({ projectId })}
					>
						{deleteProjectMutation.isPending ? "Deleting..." : "Delete project"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export function ProjectSettingsForm({ projectId }: { projectId: string }) {
	const projectQuery = useQuery(trpc.projects.byId.queryOptions({ projectId }));

	if (projectQuery.isPending) {
		return (
			<div className="space-y-4">
				<div className="h-12 w-full animate-pulse rounded-md bg-muted" />
				<div className="h-72 w-full animate-pulse rounded-md bg-muted" />
				<div className="h-72 w-full animate-pulse rounded-md bg-muted" />
			</div>
		);
	}

	if (!projectQuery.data) {
		return (
			<EmptyState
				title="Project unavailable"
				description="The project settings could not be loaded."
			/>
		);
	}

	return (
		<ProjectSettingsFormInner
			key={projectQuery.data.project.updatedAt}
			projectId={projectId}
			project={projectQuery.data}
		/>
	);
}
