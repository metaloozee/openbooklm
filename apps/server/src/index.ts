import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@openbooklm/api/context";
import { appRouter } from "@openbooklm/api/routers/index";
import { auth } from "@openbooklm/auth";
import { env } from "@openbooklm/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

function getAllowedOrigins() {
	const origins = new Set([env.CORS_ORIGIN]);

	if (env.NODE_ENV === "development") {
		const configuredOrigin = new URL(env.CORS_ORIGIN);
		const siblingHost = configuredOrigin.hostname === "localhost" ? "127.0.0.1" : "localhost";
		origins.add(
			`${configuredOrigin.protocol}//${siblingHost}${configuredOrigin.port ? `:${configuredOrigin.port}` : ""}`,
		);
	}

	return [...origins];
}

const allowedOrigins = getAllowedOrigins();
const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: (origin) => {
			if (!origin) {
				return allowedOrigins[0];
			}

			return allowedOrigins.includes(origin) ? origin : null;
		},
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
