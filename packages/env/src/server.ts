import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const googleOAuthSchema = {
	GOOGLE_CLIENT_ID: z.string().min(1).optional(),
	GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
};

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		...googleOAuthSchema,
		CORS_ORIGIN: z.url(),
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});

z.object(googleOAuthSchema)
	.refine(
		({ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET }) =>
			(!!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET) ||
			(!GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_SECRET),
		{
			message:
				"GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must either both be set or both be omitted.",
			path: ["GOOGLE_CLIENT_ID"],
		},
	)
	.parse(env);
