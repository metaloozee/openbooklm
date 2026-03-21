import { z } from "zod";

export const MODEL_PROVIDER_OPTIONS = ["openai", "anthropic", "google", "ollama"] as const;
export const PROJECT_VISIBILITY_OPTIONS = ["private", "shared"] as const;
export const SOURCE_TYPE_OPTIONS = ["pdf", "text", "markdown", "url"] as const;
export const ARTIFACT_TYPE_OPTIONS = ["summary", "faq", "study-guide", "report"] as const;
export const THEME_PREFERENCE_OPTIONS = ["system", "light", "dark"] as const;
export const DENSITY_PREFERENCE_OPTIONS = ["comfortable", "compact"] as const;

const requiredText = (label: string, max = 200) =>
	z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

const shortText = (max = 4000) => z.string().trim().max(max, `Must be ${max} characters or fewer`);
const urlOrEmpty = (message: string) =>
	z
		.string()
		.trim()
		.refine((value) => value.length === 0 || z.url(message).safeParse(value).success, {
			message,
		});

export const projectIdSchema = z.object({
	projectId: z.string().trim().min(1, "Project id is required"),
});

export const projectCreateSchema = z.object({
	name: requiredText("Project name", 120),
	description: shortText(2000),
	icon: shortText(32),
	visibility: z.enum(PROJECT_VISIBILITY_OPTIONS),
	defaultModelProvider: z.enum(MODEL_PROVIDER_OPTIONS),
	defaultModel: requiredText("Default model", 120),
});

export const projectUpdateSchema = projectIdSchema
	.extend({
		name: requiredText("Project name", 120),
		description: shortText(2000),
		icon: shortText(32),
		visibility: z.enum(PROJECT_VISIBILITY_OPTIONS),
		defaultModelProvider: z.enum(MODEL_PROVIDER_OPTIONS),
		defaultModel: requiredText("Default model", 120),
		embeddingProvider: z.enum(MODEL_PROVIDER_OPTIONS),
		embeddingModel: requiredText("Embedding model", 120),
		chunkSize: z.number().int().min(200).max(4000),
		chunkOverlap: z.number().int().min(0).max(1000),
		refreshOnSourceChange: z.boolean(),
	})
	.superRefine((value, ctx) => {
		if (value.chunkOverlap >= value.chunkSize) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["chunkOverlap"],
				message: "Chunk overlap must be smaller than chunk size.",
			});
		}
	});

export const sourceCreateSchema = projectIdSchema
	.extend({
		title: requiredText("Source title", 160),
		type: z.enum(SOURCE_TYPE_OPTIONS),
		url: urlOrEmpty("Enter a valid URL"),
		content: shortText(20000),
		indexNow: z.boolean().optional(),
	})
	.superRefine((value, ctx) => {
		if (value.type === "url" && !value.url) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["url"],
				message: "A URL source requires a valid URL",
			});
		}
	});

export const sourceActionSchema = projectIdSchema.extend({
	sourceId: z.string().trim().min(1, "Source id is required"),
});

export const artifactCreateSchema = projectIdSchema.extend({
	title: requiredText("Artifact title", 160),
	type: z.enum(ARTIFACT_TYPE_OPTIONS),
	instructions: shortText(4000),
	sourceIds: z.array(z.string().trim().min(1)),
});

export const artifactActionSchema = projectIdSchema.extend({
	artifactId: z.string().trim().min(1, "Artifact id is required"),
});

export const userSettingsUpdateSchema = z.object({
	name: requiredText("Display name", 120),
	theme: z.enum(THEME_PREFERENCE_OPTIONS),
	density: z.enum(DENSITY_PREFERENCE_OPTIONS),
	sidebarDefaultOpen: z.boolean(),
	defaultModelProvider: z.enum(MODEL_PROVIDER_OPTIONS),
	defaultModel: requiredText("Default model", 120),
	defaultArtifactType: z.enum(ARTIFACT_TYPE_OPTIONS),
	openAIApiKey: shortText(500),
	clearOpenAIApiKey: z.boolean(),
	anthropicApiKey: shortText(500),
	clearAnthropicApiKey: z.boolean(),
	googleApiKey: shortText(500),
	clearGoogleApiKey: z.boolean(),
	ollamaBaseUrl: urlOrEmpty("Enter a valid Ollama URL"),
});
