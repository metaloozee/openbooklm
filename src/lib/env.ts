import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  },
  experimental__runtimeEnv: {
    ...process.env,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  },
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_D1_TOKEN: z.string().min(1).startsWith("cfut_"),
    CLOUDFLARE_DATABASE_ID: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    NEXTJS_ENV: z.enum(["production", "development"]).default("development"),
  },
});
