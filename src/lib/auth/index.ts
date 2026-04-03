import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { cache } from "react";

import { getAuthDbAsync } from "@/lib/db";
import { env } from "@/lib/env";

const buildAuth = cache(async () => {
  const dbInstance = await getAuthDbAsync();
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

export const getAuthSession = async (headers: Headers) => {
  const auth = await initAuth();

  return auth.api.getSession({ headers });
};

export const requireAuthSession = async (
  headers: Headers
): Promise<NonNullable<Awaited<ReturnType<typeof getAuthSession>>>> => {
  const session = await getAuthSession(headers);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
};

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
