import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { cache } from "react";

import { getDbAsync } from "@/lib/db";
import { env } from "@/lib/env";

export const authBuilder = cache(async () => {
  const dbInstance = await getDbAsync();
  return betterAuth({
    database: drizzleAdapter(dbInstance, {
      provider: "sqlite",
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
});

let authInstance: Awaited<ReturnType<typeof authBuilder>> | null = null;

export const initAuth = cache(async () => {
  if (!authInstance) {
    authInstance = await authBuilder();
  }

  return authInstance;
});

export const auth = betterAuth({
  // oxlint-disable-next-line typescript/no-explicit-any
  database: drizzleAdapter(process.env.DB as any, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});
