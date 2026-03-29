import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "../db";

interface AuthEnv {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NEXT_PUBLIC_BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
}

export const getAuth = (env: AuthEnv) => {
  const db = getDb(env.DB);

  return betterAuth({
    baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
};
