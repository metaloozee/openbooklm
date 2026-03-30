import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { cache } from "react";

import { getDbAsync } from "@/lib/db";
import { env } from "@/lib/env";

const buildAuth = cache(async () => {
  const dbInstance = await getDbAsync();
  return betterAuth({
    baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
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

export const initAuth = buildAuth;

// Uncomment the code below to perform migrations through better-auth
// export const auth = betterAuth({
//   database: drizzleAdapter(process.env.DB as unknown as D1Database, {
//     provider: "sqlite",
//   }),
//   socialProviders: {
//     google: {
//       clientId: env.GOOGLE_CLIENT_ID,
//       clientSecret: env.GOOGLE_CLIENT_SECRET,
//     },
//   },
// });
