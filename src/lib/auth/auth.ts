import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { cache } from "react";

import { getDb } from "@/lib/db";
import { env } from "@/lib/env";

export const getAuth = cache(() => {
  const db = getDb();
  return betterAuth({
    database: drizzleAdapter(db, {
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
