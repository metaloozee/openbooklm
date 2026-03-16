import { user, userSettings } from "@openbooklm/db";
import { eq, sql } from "drizzle-orm";

import { userSettingsUpdateSchema } from "../contracts";
import { protectedProcedure, router } from "../index";
import { encryptSecret } from "../secrets";

function toIsoString(value: Date) {
	return value.toISOString();
}

async function getSettingsPayload(
	db: typeof import("@openbooklm/db").db,
	userId: string,
	userName: string,
	userEmail: string,
) {
	const settings = await db.query.userSettings.findFirst({
		where: eq(userSettings.userId, userId),
	});

	return {
		profile: {
			name: userName,
			email: userEmail,
		},
		preferences: {
			theme: settings?.theme ?? "system",
			density: settings?.density ?? "comfortable",
			sidebarDefaultOpen: settings?.sidebarDefaultOpen ?? true,
			defaultModelProvider: settings?.defaultModelProvider ?? "openai",
			defaultModel: settings?.defaultModel ?? "gpt-4.1-mini",
			defaultArtifactType: settings?.defaultArtifactType ?? "summary",
			hasOpenAIApiKey: Boolean(settings?.openAIApiKey),
			hasAnthropicApiKey: Boolean(settings?.anthropicApiKey),
			hasGoogleApiKey: Boolean(settings?.googleApiKey),
			hasOllamaBaseUrl: Boolean(settings?.ollamaBaseUrl),
			updatedAt: settings?.updatedAt ? toIsoString(settings.updatedAt) : null,
		},
	};
}

export const userSettingsRouter = router({
	get: protectedProcedure.query(async ({ ctx }) => {
		return getSettingsPayload(
			ctx.db,
			ctx.userId,
			ctx.session.user.name,
			ctx.session.user.email,
		);
	}),
	update: protectedProcedure.input(userSettingsUpdateSchema).mutation(async ({ ctx, input }) => {
		const timestamp = new Date();
		const encryptedOpenAIApiKey = input.openAIApiKey.trim()
			? encryptSecret(input.openAIApiKey.trim())
			: null;
		const encryptedAnthropicApiKey = input.anthropicApiKey.trim()
			? encryptSecret(input.anthropicApiKey.trim())
			: null;
		const encryptedGoogleApiKey = input.googleApiKey.trim()
			? encryptSecret(input.googleApiKey.trim())
			: null;
		const encryptedOllamaBaseUrl = input.ollamaBaseUrl.trim()
			? encryptSecret(input.ollamaBaseUrl.trim())
			: null;

		await ctx.db.batch([
			ctx.db
				.update(user)
				.set({
					name: input.name,
					updatedAt: timestamp,
				})
				.where(eq(user.id, ctx.userId)),
			ctx.db
				.insert(userSettings)
				.values({
					userId: ctx.userId,
					theme: input.theme,
					density: input.density,
					sidebarDefaultOpen: input.sidebarDefaultOpen,
					defaultModelProvider: input.defaultModelProvider,
					defaultModel: input.defaultModel,
					defaultArtifactType: input.defaultArtifactType,
					openAIApiKey: input.clearOpenAIApiKey ? null : encryptedOpenAIApiKey,
					anthropicApiKey: input.clearAnthropicApiKey ? null : encryptedAnthropicApiKey,
					googleApiKey: input.clearGoogleApiKey ? null : encryptedGoogleApiKey,
					ollamaBaseUrl: encryptedOllamaBaseUrl,
					createdAt: timestamp,
					updatedAt: timestamp,
				})
				.onConflictDoUpdate({
					target: userSettings.userId,
					set: {
						theme: input.theme,
						density: input.density,
						sidebarDefaultOpen: input.sidebarDefaultOpen,
						defaultModelProvider: input.defaultModelProvider,
						defaultModel: input.defaultModel,
						defaultArtifactType: input.defaultArtifactType,
						openAIApiKey: input.clearOpenAIApiKey
							? null
							: encryptedOpenAIApiKey
								? encryptedOpenAIApiKey
								: sql`${userSettings.openAIApiKey}`,
						anthropicApiKey: input.clearAnthropicApiKey
							? null
							: encryptedAnthropicApiKey
								? encryptedAnthropicApiKey
								: sql`${userSettings.anthropicApiKey}`,
						googleApiKey: input.clearGoogleApiKey
							? null
							: encryptedGoogleApiKey
								? encryptedGoogleApiKey
								: sql`${userSettings.googleApiKey}`,
						ollamaBaseUrl: encryptedOllamaBaseUrl
							? encryptedOllamaBaseUrl
							: sql`${userSettings.ollamaBaseUrl}`,
						updatedAt: timestamp,
					},
				}),
		]);

		return getSettingsPayload(ctx.db, ctx.userId, input.name, ctx.session.user.email);
	}),
});
