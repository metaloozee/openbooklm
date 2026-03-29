// oxlint-disable typescript/no-non-null-assertion

import { defineConfig } from "drizzle-kit";

import { env } from "@/lib/env";

export default defineConfig({
  dbCredentials: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: env.CLOUDFLARE_DATABASE_ID,
    token: env.CLOUDFLARE_D1_TOKEN,
  },
  dialect: "sqlite",
  driver: "d1-http",
  out: "./drizzle",
  schema: "./src/lib/db/schema/index.ts",
});
