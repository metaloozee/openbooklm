"use client";

import {
	ARTIFACT_TYPE_OPTIONS,
	DENSITY_PREFERENCE_OPTIONS,
	MODEL_PROVIDER_OPTIONS,
	THEME_PREFERENCE_OPTIONS,
	userSettingsUpdateSchema,
} from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import { Checkbox } from "@openbooklm/ui/components/checkbox";
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
		<div className="space-y-4">
			<div>
				<h1 className="text-lg font-semibold tracking-tight">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Manage account defaults and provider configuration used across projects.
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
						<CardTitle>Profile</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
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
						<div className="space-y-2">
							<Label>Email</Label>
							<Input value={data.profile.email} disabled />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Preferences</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							<form.Field name="theme">
								{(field) => (
									<div className="space-y-2">
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
									<div className="space-y-2">
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
									<div className="space-y-2">
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
									<div className="space-y-2">
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
									<div className="space-y-2">
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
									<div className="space-y-1">
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
						<CardTitle>Provider credentials</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="openAIApiKey">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											OpenAI API key{" "}
											{data.preferences.hasOpenAIApiKey ? "(saved)" : ""}
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
									<div className="flex items-end">
										<label className="flex items-center gap-3 rounded-md border p-3">
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
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											Anthropic API key{" "}
											{data.preferences.hasAnthropicApiKey ? "(saved)" : ""}
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
									<div className="flex items-end">
										<label className="flex items-center gap-3 rounded-md border p-3">
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
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											Google API key{" "}
											{data.preferences.hasGoogleApiKey ? "(saved)" : ""}
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
									<div className="flex items-end">
										<label className="flex items-center gap-3 rounded-md border p-3">
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
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										Ollama base URL{" "}
										{data.preferences.hasOllamaBaseUrl ? "(saved)" : ""}
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
								{isSubmitting || updateSettingsMutation.isPending
									? "Saving..."
									: "Save settings"}
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
			<div className="space-y-4">
				<div className="h-12 w-full animate-pulse rounded-md bg-muted" />
				<div className="h-72 w-full animate-pulse rounded-md bg-muted" />
			</div>
		);
	}

	if (!settingsQuery.data) {
		return (
			<EmptyState
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
