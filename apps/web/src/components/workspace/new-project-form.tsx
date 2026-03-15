"use client";

import {
	MODEL_PROVIDER_OPTIONS,
	PROJECT_VISIBILITY_OPTIONS,
	projectCreateSchema,
} from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@openbooklm/ui/components/card";
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FieldErrors, NativeSelect } from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

export function NewProjectForm() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const createProjectMutation = useMutation(
		trpc.projects.create.mutationOptions({
			onSuccess: async (project) => {
				await queryClient.invalidateQueries(trpc.projects.list.queryFilter());
				toast.success("Project created");
				router.push(`/dashboard/projects/${project.id}`);
			},
			onError: (error) => {
				toast.error(error.message);
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
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">New Project</h1>
				<p className="text-sm text-muted-foreground">
					Create a workspace with its own source inventory, default model settings, and
					artifact pipeline.
				</p>
			</div>

			<Card className="max-w-3xl">
				<CardHeader>
					<CardTitle>Project details</CardTitle>
					<CardDescription>
						Start with the basic workspace metadata. You can fine-tune indexing and
						model settings later.
					</CardDescription>
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
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="AI research workspace"
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
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											maxLength={8}
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
										placeholder="Describe the research goal, source set, or operating context."
									/>
									<FieldErrors errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>

						<div className="grid gap-4 md:grid-cols-3">
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
										</NativeSelect>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="defaultModelProvider">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Provider</Label>
										<NativeSelect
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
										</NativeSelect>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="defaultModel">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Model</Label>
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
						</div>

						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<div className="flex justify-end gap-2">
									<Button variant="outline" asChild>
										<Link href="/dashboard">Cancel</Link>
									</Button>
									<Button
										type="submit"
										disabled={
											!canSubmit ||
											isSubmitting ||
											createProjectMutation.isPending
										}
									>
										{isSubmitting || createProjectMutation.isPending
											? "Creating..."
											: "Create project"}
									</Button>
								</div>
							)}
						</form.Subscribe>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
