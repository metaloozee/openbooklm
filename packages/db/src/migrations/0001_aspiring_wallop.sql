ALTER TABLE "artifact" ALTER COLUMN "content_json" TYPE jsonb USING content_json::jsonb;
