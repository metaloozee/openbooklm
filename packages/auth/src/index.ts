import { db } from "@openbooklm/db";
import * as schema from "@openbooklm/db/schema/auth";
import { env } from "@openbooklm/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

function getTrustedOrigins() {
	const origins = new Set([env.CORS_ORIGIN]);

	if (env.NODE_ENV !== "development") {
		return [...origins];
	}

	const configuredOrigin = new URL(env.CORS_ORIGIN);
	const siblingHost = configuredOrigin.hostname === "localhost" ? "127.0.0.1" : "localhost";
	origins.add(
		`${configuredOrigin.protocol}//${siblingHost}${configuredOrigin.port ? `:${configuredOrigin.port}` : ""}`,
	);

	return [...origins];
}

const googleProvider =
	env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
		? {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
				prompt: "select_account" as const,
			}
		: undefined;

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	trustedOrigins: getTrustedOrigins(),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		...(googleProvider ? { google: googleProvider } : {}),
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [],
});
