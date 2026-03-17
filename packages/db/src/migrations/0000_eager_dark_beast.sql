CREATE TYPE "public"."artifact_type" AS ENUM('summary', 'faq', 'study-guide', 'report');--> statement-breakpoint
CREATE TYPE "public"."density_preference" AS ENUM('comfortable', 'compact');--> statement-breakpoint
CREATE TYPE "public"."model_provider" AS ENUM('openai', 'anthropic', 'google', 'ollama');--> statement-breakpoint
CREATE TYPE "public"."project_visibility" AS ENUM('private', 'shared');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('pending', 'indexing', 'indexed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('pdf', 'text', 'markdown', 'url');--> statement-breakpoint
CREATE TYPE "public"."theme_preference" AS ENUM('system', 'light', 'dark');--> statement-breakpoint
CREATE TABLE "artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"type" "artifact_type" NOT NULL,
	"instructions" text,
	"content" text DEFAULT '' NOT NULL,
	"content_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifact_source" (
	"artifact_id" text NOT NULL,
	"source_id" text NOT NULL,
	CONSTRAINT "artifact_source_artifact_id_source_id_pk" PRIMARY KEY("artifact_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text,
	"visibility" "project_visibility" DEFAULT 'private' NOT NULL,
	"default_model_provider" "model_provider" DEFAULT 'openai' NOT NULL,
	"default_model" text DEFAULT 'gpt-4.1-mini' NOT NULL,
	"embedding_provider" "model_provider" DEFAULT 'openai' NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"chunk_size" integer DEFAULT 1200 NOT NULL,
	"chunk_overlap" integer DEFAULT 200 NOT NULL,
	"refresh_on_source_change" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"type" "source_type" NOT NULL,
	"status" "source_status" DEFAULT 'pending' NOT NULL,
	"url" text,
	"content" text DEFAULT '' NOT NULL,
	"content_bytes" integer DEFAULT 0 NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"indexed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" "theme_preference" DEFAULT 'system' NOT NULL,
	"density" "density_preference" DEFAULT 'comfortable' NOT NULL,
	"sidebar_default_open" boolean DEFAULT true NOT NULL,
	"default_model_provider" "model_provider" DEFAULT 'openai' NOT NULL,
	"default_model" text DEFAULT 'gpt-4.1-mini' NOT NULL,
	"default_artifact_type" "artifact_type" DEFAULT 'summary' NOT NULL,
	"openai_api_key" text,
	"anthropic_api_key" text,
	"google_api_key" text,
	"ollama_base_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_source" ADD CONSTRAINT "artifact_source_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_source" ADD CONSTRAINT "artifact_source_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source" ADD CONSTRAINT "source_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifact_project_id_idx" ON "artifact" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "artifact_project_created_at_idx" ON "artifact" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "artifact_project_updatedat_idx" ON "artifact" USING btree ("project_id","updated_at");--> statement-breakpoint
CREATE INDEX "artifact_created_by_user_id_idx" ON "artifact" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "project_owner_id_idx" ON "project" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "project_owner_updated_at_idx" ON "project" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "source_project_id_idx" ON "source" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "source_project_status_idx" ON "source" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "source_project_updatedat_idx" ON "source" USING btree ("project_id","updated_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");