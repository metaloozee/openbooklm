"use client";

import {
	MODEL_PROVIDER_OPTIONS,
	PROJECT_VISIBILITY_OPTIONS,
	projectUpdateSchema,
} from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@openbooklm/ui/components/card";
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
import { Separator } from "@openbooklm/ui/components/separator";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { Spinner } from "@openbooklm/ui/components/spinner";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, SaveIcon, SettingsIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	FieldErrors,
	Select,
	QueryErrorState,
} from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@openbooklm/ui/components/empty";

function BufferedNumberInput({
	field,
	label,
}: {
	field: {
		name: string;
		state: { value: number; meta: { errors: Array<{ message?: string } | undefined> } };
		handleBlur: () => void;
		handleChange: (value: number) => void;
	};
	label: string;
}) {
	const [draftValue, setDraftValue] = useState(String(field.state.value));

	useEffect(() => {
		setDraftValue(String(field.state.value));
	}, [field.state.value]);

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={field.name}>{label}</Label>
			<Input
				id={field.name}
				name={field.name}
				type="number"
				value={draftValue}
				onChange={(event) => setDraftValue(event.target.value)}
				onBlur={(event) => {
					field.handleBlur();
					if (event.target.value.trim() === "") {
						setDraftValue(String(field.state.value));
						return;
					}

					const parsedValue = event.target.valueAsNumber;
					if (Number.isFinite(parsedValue)) {
						field.handleChange(parsedValue);
						setDraftValue(String(parsedValue));
					} else {
						setDraftValue(String(field.state.value));
					}
				}}
			/>
			<FieldErrors errors={field.state.meta.errors} />
		</div>
	);
}

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
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deleteConfirmationValue, setDeleteConfirmationValue] = useState("");

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
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Project Settings</h1>
				<p className="text-sm text-muted-foreground">
					Control the project metadata, model defaults, and indexing profile.
				</p>
			</div>

			<form
				noValidate
				className="flex flex-col gap-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle>General</CardTitle>
						<CardDescription>
							Project name, description, and visibility settings.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid gap-4 md:grid-cols-[1fr_100px]">
							<form.Field name="name">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Name</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
							<form.Field name="icon">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Icon</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											className="text-center text-lg"
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="description">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>Description</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										className="min-h-20 resize-none"
									/>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="visibility">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>Visibility</Label>
									<Select
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) =>
											field.handleChange(
												event.target
													.value as (typeof PROJECT_VISIBILITY_OPTIONS)[number],
											)
										}
									>
										{PROJECT_VISIBILITY_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</Select>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Model defaults</CardTitle>
						<CardDescription>
							Default provider and model used for conversations and artifact
							generation.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						<form.Field name="defaultModelProvider">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>Default provider</Label>
									<Select
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) =>
											field.handleChange(
												event.target
													.value as (typeof MODEL_PROVIDER_OPTIONS)[number],
											)
										}
									>
										{MODEL_PROVIDER_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</Select>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<form.Field name="defaultModel">
							{(field) => (
								<div className="flex flex-col gap-1.5">
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
						<CardDescription>
							Embedding model and chunk settings for source processing.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="embeddingProvider">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Embedding provider</Label>
										<Select
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(
													event.target
														.value as (typeof MODEL_PROVIDER_OPTIONS)[number],
												)
											}
										>
											{MODEL_PROVIDER_OPTIONS.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</Select>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="embeddingModel">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Embedding model</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="chunkSize">
								{(field) => (
									<BufferedNumberInput field={field} label="Chunk size" />
								)}
							</form.Field>

							<form.Field name="chunkOverlap">
								{(field) => (
									<BufferedNumberInput field={field} label="Chunk overlap" />
								)}
							</form.Field>
						</div>

						<form.Field name="refreshOnSourceChange">
							{(field) => (
								<div className="flex items-start gap-3 rounded-md border p-3">
									<Checkbox
										id={field.name}
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked === true)
										}
									/>
									<div className="flex flex-col gap-0.5">
										<Label htmlFor={field.name}>
											Refresh index automatically
										</Label>
										<p className="text-xs/relaxed text-muted-foreground">
											Keep the project index current when sources are added or
											updated.
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
								disabled={
									!canSubmit || isSubmitting || updateProjectMutation.isPending
								}
							>
								{isSubmitting || updateProjectMutation.isPending ? (
									<>
										<Spinner data-icon="inline-start" />
										Saving...
									</>
								) : (
									<>
										<SaveIcon data-icon="inline-start" />
										Save changes
									</>
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>

			<Separator />

			<Card className="border-destructive/30">
				<CardHeader>
					<div className="flex items-center gap-2">
						<AlertCircleIcon className="size-4 text-destructive" />
						<CardTitle>Danger zone</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-sm font-medium">Delete project</p>
						<p className="text-xs/relaxed text-muted-foreground">
							This removes the workspace and all related sources and artifacts. This
							action cannot be undone.
						</p>
					</div>
					<Button
						variant="destructive"
						size="sm"
						disabled={deleteProjectMutation.isPending}
						onClick={() => {
							setDeleteConfirmationValue("");
							setIsDeleteDialogOpen(true);
						}}
					>
						<Trash2Icon data-icon="inline-start" />
						{deleteProjectMutation.isPending ? "Deleting..." : "Delete project"}
					</Button>
				</CardContent>
			</Card>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirm project deletion</DialogTitle>
						<DialogDescription>
							Type{" "}
							<span className="font-medium text-foreground">
								{project.project.name}
							</span>{" "}
							to permanently delete this workspace and all its data.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="delete-project-confirmation">Project name</Label>
						<Input
							id="delete-project-confirmation"
							value={deleteConfirmationValue}
							onChange={(event) => setDeleteConfirmationValue(event.target.value)}
							placeholder={project.project.name}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							disabled={deleteProjectMutation.isPending}
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={
								deleteProjectMutation.isPending ||
								deleteConfirmationValue !== project.project.name
							}
							onClick={() => {
								deleteProjectMutation.mutate(
									{ projectId },
									{
										onSuccess: () => {
											setIsDeleteDialogOpen(false);
										},
									},
								);
							}}
						>
							{deleteProjectMutation.isPending ? (
								<>
									<Spinner data-icon="inline-start" />
									Deleting...
								</>
							) : (
								<>
									<Trash2Icon data-icon="inline-start" />
									Confirm delete
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export function ProjectSettingsForm({ projectId }: { projectId: string }) {
	const projectQuery = useQuery(trpc.projects.byId.queryOptions({ projectId }));

	if (projectQuery.isPending) {
		return (
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (projectQuery.isError) {
		return (
			<QueryErrorState
				title="Project settings unavailable"
				description={projectQuery.error.message}
				onRetry={() => void projectQuery.refetch()}
			/>
		);
	}

	if (!projectQuery.data) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant={"icon"}>
						<SettingsIcon />
					</EmptyMedia>
					<EmptyTitle>Project unavailable</EmptyTitle>
					<EmptyDescription>
						The project settings could not be loaded.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
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
