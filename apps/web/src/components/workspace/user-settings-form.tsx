"use client";

import {
	ARTIFACT_TYPE_OPTIONS,
	DENSITY_PREFERENCE_OPTIONS,
	MODEL_PROVIDER_OPTIONS,
	THEME_PREFERENCE_OPTIONS,
	userSettingsUpdateSchema,
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
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { Spinner } from "@openbooklm/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyIcon, SaveIcon, SettingsIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, FieldErrors, NativeSelect } from "@/components/workspace/primitives";
import { trpc } from "@/utils/trpc";

function UserSettingsFormInner({
	data,
}: {
	data: {
		profile: {
			name: string;
			email: string;
		};
		preferences: {
			theme: "system" | "light" | "dark";
			density: "comfortable" | "compact";
			sidebarDefaultOpen: boolean;
			defaultModelProvider: "openai" | "anthropic" | "google" | "ollama";
			defaultModel: string;
			defaultArtifactType: "summary" | "faq" | "study-guide" | "report";
			hasOpenAIApiKey: boolean;
			hasAnthropicApiKey: boolean;
			hasGoogleApiKey: boolean;
			hasOllamaBaseUrl: boolean;
			updatedAt: string | null;
		};
	};
}) {
	const queryClient = useQueryClient();

	const updateSettingsMutation = useMutation(
		trpc.userSettings.update.mutationOptions({
			onSuccess: async (_data, submittedValues) => {
				await queryClient.invalidateQueries(trpc.userSettings.get.queryFilter());
				document.cookie = `sidebar_state=${submittedValues.sidebarDefaultOpen}; path=/; max-age=${60 * 60 * 24 * 7}`;
				toast.success("Settings saved");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: data.profile.name,
			theme: data.preferences.theme,
			density: data.preferences.density,
			sidebarDefaultOpen: data.preferences.sidebarDefaultOpen,
			defaultModelProvider: data.preferences.defaultModelProvider,
			defaultModel: data.preferences.defaultModel,
			defaultArtifactType: data.preferences.defaultArtifactType,
			openAIApiKey: "",
			clearOpenAIApiKey: false,
			anthropicApiKey: "",
			clearAnthropicApiKey: false,
			googleApiKey: "",
			clearGoogleApiKey: false,
			ollamaBaseUrl: "",
		},
		validators: {
			onSubmit: userSettingsUpdateSchema,
		},
		onSubmit: async ({ value }) => {
			await updateSettingsMutation.mutateAsync(value);
		},
	});

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Manage account defaults and provider configuration used across projects.
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
						<CardTitle>Profile</CardTitle>
						<CardDescription>Your display name and email address.</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						<form.Field name="name">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>Display name</Label>
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
						<div className="flex flex-col gap-1.5">
							<Label>Email</Label>
							<Input value={data.profile.email} disabled />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Preferences</CardTitle>
						<CardDescription>
							Interface appearance and default model settings.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							<form.Field name="theme">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Theme</Label>
										<NativeSelect
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(
													event.target
														.value as (typeof THEME_PREFERENCE_OPTIONS)[number],
												)
											}
										>
											{THEME_PREFERENCE_OPTIONS.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</NativeSelect>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="density">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Density</Label>
										<NativeSelect
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(
													event.target
														.value as (typeof DENSITY_PREFERENCE_OPTIONS)[number],
												)
											}
										>
											{DENSITY_PREFERENCE_OPTIONS.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</NativeSelect>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="defaultArtifactType">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Default artifact type</Label>
										<NativeSelect
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
										</NativeSelect>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="defaultModelProvider">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Default model provider</Label>
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
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>Default model</Label>
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

						<form.Field name="sidebarDefaultOpen">
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
										<Label htmlFor={field.name}>Open sidebar by default</Label>
										<p className="text-xs/relaxed text-muted-foreground">
											This updates the persisted sidebar state for future
											dashboard visits.
										</p>
									</div>
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<KeyIcon className="size-4 text-muted-foreground" />
							<CardTitle>Provider credentials</CardTitle>
						</div>
						<CardDescription>
							API keys are encrypted and stored securely. They are never displayed
							after saving.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="openAIApiKey">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>
											OpenAI API key{" "}
											{data.preferences.hasOpenAIApiKey ? (
												<span className="text-xs text-muted-foreground">
													(saved)
												</span>
											) : null}
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="sk-..."
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
							<form.Field name="clearOpenAIApiKey">
								{(field) => (
									<div className="flex items-end pb-0.5">
										<label className="flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-muted/30">
											<Checkbox
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(Boolean(checked))
												}
											/>
											<span className="text-xs/relaxed">
												Clear saved OpenAI key
											</span>
										</label>
									</div>
								)}
							</form.Field>

							<form.Field name="anthropicApiKey">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>
											Anthropic API key{" "}
											{data.preferences.hasAnthropicApiKey ? (
												<span className="text-xs text-muted-foreground">
													(saved)
												</span>
											) : null}
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
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
							<form.Field name="clearAnthropicApiKey">
								{(field) => (
									<div className="flex items-end pb-0.5">
										<label className="flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-muted/30">
											<Checkbox
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(Boolean(checked))
												}
											/>
											<span className="text-xs/relaxed">
												Clear saved Anthropic key
											</span>
										</label>
									</div>
								)}
							</form.Field>

							<form.Field name="googleApiKey">
								{(field) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={field.name}>
											Google API key{" "}
											{data.preferences.hasGoogleApiKey ? (
												<span className="text-xs text-muted-foreground">
													(saved)
												</span>
											) : null}
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
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
							<form.Field name="clearGoogleApiKey">
								{(field) => (
									<div className="flex items-end pb-0.5">
										<label className="flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-muted/30">
											<Checkbox
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(Boolean(checked))
												}
											/>
											<span className="text-xs/relaxed">
												Clear saved Google key
											</span>
										</label>
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="ollamaBaseUrl">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={field.name}>
										Ollama base URL{" "}
										{data.preferences.hasOllamaBaseUrl ? (
											<span className="text-xs text-muted-foreground">
												(saved)
											</span>
										) : null}
									</Label>
									<Input
										id={field.name}
										name={field.name}
										type="url"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="http://localhost:11434"
									/>
									<FieldErrors errors={field.state.meta.errors} />
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
									!canSubmit || isSubmitting || updateSettingsMutation.isPending
								}
							>
								{isSubmitting || updateSettingsMutation.isPending ? (
									<>
										<Spinner data-icon="inline-start" />
										Saving...
									</>
								) : (
									<>
										<SaveIcon data-icon="inline-start" />
										Save settings
									</>
								)}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}

export function UserSettingsForm() {
	const settingsQuery = useQuery(trpc.userSettings.get.queryOptions());

	if (settingsQuery.isPending) {
		return (
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!settingsQuery.data) {
		return (
			<EmptyState
				icon={SettingsIcon}
				title="Settings unavailable"
				description="The user settings could not be loaded."
			/>
		);
	}

	return (
		<UserSettingsFormInner
			key={settingsQuery.data.preferences.updatedAt ?? settingsQuery.data.profile.email}
			data={settingsQuery.data}
		/>
	);
}
