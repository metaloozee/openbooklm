"use client";

import {
	MODEL_PROVIDER_OPTIONS,
	PROJECT_VISIBILITY_OPTIONS,
	projectCreateSchema,
} from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
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
import { Spinner } from "@openbooklm/ui/components/spinner";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FieldErrors, Select } from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function CreateProjectDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const createProjectMutation = useMutation(
		trpc.projects.create.mutationOptions({
			onSuccess: async (project) => {
				await queryClient.invalidateQueries(trpc.projects.list.queryFilter());
				toast.success("Project created");
				onOpenChange(false);
				router.push(`/dashboard/projects/${project.id}`);
			},
			onError: (error) => {
				console.error("Project creation failed", error);
				toast.error("Unable to create project, please try again.");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			icon: "📚",
			visibility: "private" as (typeof PROJECT_VISIBILITY_OPTIONS)[number],
			defaultModelProvider: "openai" as (typeof MODEL_PROVIDER_OPTIONS)[number],
			defaultModel: "gpt-4.1-mini",
		},
		validators: {
			onSubmit: projectCreateSchema,
		},
		onSubmit: async ({ value }) => {
			await createProjectMutation.mutateAsync(value);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>New project</DialogTitle>
					<DialogDescription>
						Create a workspace with its own source inventory, model settings, and
						artifact pipeline.
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
					<div className="grid gap-4 sm:grid-cols-[1fr_100px]">
						<form.Field name="name">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>Name</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="AI research workspace"
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
										onChange={(event) => field.handleChange(event.target.value)}
										maxLength={8}
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
									placeholder="Describe the research goal, source set, or operating context."
									className="min-h-20 resize-none"
								/>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<div className="grid gap-4 sm:grid-cols-3">
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

						<form.Field name="defaultModelProvider">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>Provider</Label>
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
									<Label htmlFor={field.name}>Model</Label>
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
											createProjectMutation.isPending
										}
									>
										{isSubmitting || createProjectMutation.isPending ? (
											<>
												<Spinner data-icon="inline-start" />
												Creating...
											</>
										) : (
											<>
												<PlusIcon data-icon="inline-start" />
												Create project
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
