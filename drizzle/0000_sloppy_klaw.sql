CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunk" (
	"char_end" integer,
	"char_start" integer,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"document_id" text NOT NULL,
	"embedding" vector(1536),
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"text" text NOT NULL,
	"vector_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_embedding" (
	"chunk_id" text NOT NULL,
	"document_id" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"vector_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"id" text PRIMARY KEY NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"slug" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_document" (
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"content_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ingestion_version" integer DEFAULT 1 NOT NULL,
	"last_ingestion_attempt_at" timestamp,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"processed_at" timestamp,
	"processing_error" text,
	"processing_started_at" timestamp,
	"processing_status" text DEFAULT 'ready' NOT NULL,
	"project_id" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"source_text_object_key" text,
	"vector_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_document_id_project_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."project_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_embedding" ADD CONSTRAINT "document_embedding_chunk_id_document_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."document_chunk"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_embedding" ADD CONSTRAINT "document_embedding_document_id_project_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."project_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_embedding" ADD CONSTRAINT "document_embedding_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_embedding" ADD CONSTRAINT "document_embedding_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_document" ADD CONSTRAINT "project_document_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_document" ADD CONSTRAINT "project_document_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunk_document_chunk_unique" ON "document_chunk" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunk_vector_id_unique" ON "document_chunk" USING btree ("vector_id");--> statement-breakpoint
CREATE INDEX "document_chunk_project_created_idx" ON "document_chunk" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "document_chunk_owner_created_idx" ON "document_chunk" USING btree ("owner_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_embedding_chunk_id_unique" ON "document_embedding" USING btree ("chunk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_embedding_vector_id_unique" ON "document_embedding" USING btree ("vector_id");--> statement-breakpoint
CREATE INDEX "document_embedding_project_document_idx" ON "document_embedding" USING btree ("project_id","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_owner_slug_unique" ON "project" USING btree ("owner_user_id","slug");--> statement-breakpoint
CREATE INDEX "project_owner_updated_idx" ON "project" USING btree ("owner_user_id","updated_at");--> statement-breakpoint
CREATE INDEX "project_document_owner_created_idx" ON "project_document" USING btree ("owner_user_id","created_at");--> statement-breakpoint
CREATE INDEX "project_document_project_created_idx" ON "project_document" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "project_document_project_status_created_idx" ON "project_document" USING btree ("project_id","processing_status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_document_object_key_unique" ON "project_document" USING btree ("object_key");