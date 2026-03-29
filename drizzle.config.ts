// oxlint-disable typescript/no-non-null-assertion

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".dev.vars" });

export default defineConfig({
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
  dialect: "sqlite",
  driver: "d1-http",
  out: "./drizzle",
  schema: "./src/lib/db/schema/index.ts",
});
