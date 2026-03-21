import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const projectVisibilityEnum = pgEnum("project_visibility", ["private", "shared"]);
export const modelProviderEnum = pgEnum("model_provider", [
	"openai",
	"anthropic",
	"google",
	"ollama",
]);
export const sourceTypeEnum = pgEnum("source_type", ["pdf", "text", "markdown", "url"]);
export const sourceStatusEnum = pgEnum("source_status", [
	"pending",
	"indexing",
	"indexed",
	"failed",
]);
export const artifactTypeEnum = pgEnum("artifact_type", [
	"summary",
	"faq",
	"study-guide",
	"report",
]);
export const themePreferenceEnum = pgEnum("theme_preference", ["system", "light", "dark"]);
export const densityPreferenceEnum = pgEnum("density_preference", ["comfortable", "compact"]);

export type ArtifactContentJson = Record<string, unknown>;

export const project = pgTable(
	"project",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description").notNull().default(""),
		icon: text("icon"),
		visibility: projectVisibilityEnum("visibility").notNull().default("private"),
		defaultModelProvider: modelProviderEnum("default_model_provider")
			.notNull()
			.default("openai"),
		defaultModel: text("default_model").notNull().default("gpt-4.1-mini"),
		embeddingProvider: modelProviderEnum("embedding_provider").notNull().default("openai"),
		embeddingModel: text("embedding_model").notNull().default("text-embedding-3-small"),
		chunkSize: integer("chunk_size").notNull().default(1200),
		chunkOverlap: integer("chunk_overlap").notNull().default(200),
		refreshOnSourceChange: boolean("refresh_on_source_change").notNull().default(true),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("project_owner_id_idx").on(table.ownerId),
		index("project_owner_updated_at_idx").on(table.ownerId, table.updatedAt),
	],
);

export const source = pgTable(
	"source",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		type: sourceTypeEnum("type").notNull(),
		status: sourceStatusEnum("status").notNull().default("pending"),
		url: text("url"),
		content: text("content").notNull().default(""),
		contentBytes: integer("content_bytes").notNull().default(0),
		pageCount: integer("page_count").notNull().default(0),
		chunkCount: integer("chunk_count").notNull().default(0),
		indexedAt: timestamp("indexed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("source_project_id_idx").on(table.projectId),
		index("source_project_status_idx").on(table.projectId, table.status),
		index("source_project_updatedat_idx").on(table.projectId, table.updatedAt),
	],
);

export const artifact = pgTable(
	"artifact",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		createdByUserId: text("created_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		type: artifactTypeEnum("type").notNull(),
		instructions: text("instructions"),
		content: text("content").notNull().default(""),
		contentJson: jsonb("content_json").$type<ArtifactContentJson | null>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("artifact_project_id_idx").on(table.projectId),
		index("artifact_project_created_at_idx").on(table.projectId, table.createdAt),
		index("artifact_project_updatedat_idx").on(table.projectId, table.updatedAt),
		index("artifact_created_by_user_id_idx").on(table.createdByUserId),
	],
);

export const artifactSource = pgTable(
	"artifact_source",
	{
		artifactId: text("artifact_id")
			.notNull()
			.references(() => artifact.id, { onDelete: "cascade" }),
		sourceId: text("source_id")
			.notNull()
			.references(() => source.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.artifactId, table.sourceId] })],
);

export const userSettings = pgTable("user_settings", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	theme: themePreferenceEnum("theme").notNull().default("system"),
	density: densityPreferenceEnum("density").notNull().default("comfortable"),
	sidebarDefaultOpen: boolean("sidebar_default_open").notNull().default(true),
	defaultModelProvider: modelProviderEnum("default_model_provider").notNull().default("openai"),
	defaultModel: text("default_model").notNull().default("gpt-4.1-mini"),
	defaultArtifactType: artifactTypeEnum("default_artifact_type").notNull().default("summary"),
	openAIApiKey: text("openai_api_key"),
	anthropicApiKey: text("anthropic_api_key"),
	googleApiKey: text("google_api_key"),
	ollamaBaseUrl: text("ollama_base_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const projectRelations = relations(project, ({ many, one }) => ({
	owner: one(user, {
		fields: [project.ownerId],
		references: [user.id],
	}),
	sources: many(source),
	artifacts: many(artifact),
}));

export const sourceRelations = relations(source, ({ many, one }) => ({
	project: one(project, {
		fields: [source.projectId],
		references: [project.id],
	}),
	artifactLinks: many(artifactSource),
}));

export const artifactRelations = relations(artifact, ({ many, one }) => ({
	project: one(project, {
		fields: [artifact.projectId],
		references: [project.id],
	}),
	createdByUser: one(user, {
		fields: [artifact.createdByUserId],
		references: [user.id],
	}),
	sourceLinks: many(artifactSource),
}));

export const artifactSourceRelations = relations(artifactSource, ({ one }) => ({
	artifact: one(artifact, {
		fields: [artifactSource.artifactId],
		references: [artifact.id],
	}),
	source: one(source, {
		fields: [artifactSource.sourceId],
		references: [source.id],
	}),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(user, {
		fields: [userSettings.userId],
		references: [user.id],
	}),
}));
