import { user, userSettings } from "@openbooklm/db";
import { eq } from "drizzle-orm";

import { userSettingsUpdateSchema } from "../contracts";
import { protectedProcedure, router } from "../index";

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
			ollamaBaseUrl: settings?.ollamaBaseUrl ?? "",
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
		await ctx.db
			.update(user)
			.set({
				name: input.name,
				updatedAt: new Date(),
			})
			.where(eq(user.id, ctx.userId));

		const existingSettings = await ctx.db.query.userSettings.findFirst({
			where: eq(userSettings.userId, ctx.userId),
		});

		await ctx.db
			.insert(userSettings)
			.values({
				userId: ctx.userId,
				theme: input.theme,
				density: input.density,
				sidebarDefaultOpen: input.sidebarDefaultOpen,
				defaultModelProvider: input.defaultModelProvider,
				defaultModel: input.defaultModel,
				defaultArtifactType: input.defaultArtifactType,
				openAIApiKey: input.clearOpenAIApiKey
					? null
					: (input.openAIApiKey ?? existingSettings?.openAIApiKey ?? null),
				anthropicApiKey: input.clearAnthropicApiKey
					? null
					: (input.anthropicApiKey ?? existingSettings?.anthropicApiKey ?? null),
				googleApiKey: input.clearGoogleApiKey
					? null
					: (input.googleApiKey ?? existingSettings?.googleApiKey ?? null),
				ollamaBaseUrl: input.ollamaBaseUrl ?? null,
				updatedAt: new Date(),
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
						: (input.openAIApiKey ?? existingSettings?.openAIApiKey ?? null),
					anthropicApiKey: input.clearAnthropicApiKey
						? null
						: (input.anthropicApiKey ?? existingSettings?.anthropicApiKey ?? null),
					googleApiKey: input.clearGoogleApiKey
						? null
						: (input.googleApiKey ?? existingSettings?.googleApiKey ?? null),
					ollamaBaseUrl: input.ollamaBaseUrl ?? null,
					updatedAt: new Date(),
				},
			});

		return getSettingsPayload(ctx.db, ctx.userId, input.name, ctx.session.user.email);
	}),
});
