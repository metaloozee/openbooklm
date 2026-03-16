export function expandTrustedOrigins(origin: string, nodeEnv: string) {
	const origins = new Set([origin]);

	if (nodeEnv !== "development") {
		return [...origins];
	}

	const configuredOrigin = new URL(origin);
	const siblingHost = configuredOrigin.hostname === "localhost" ? "127.0.0.1" : "localhost";
	origins.add(
		`${configuredOrigin.protocol}//${siblingHost}${configuredOrigin.port ? `:${configuredOrigin.port}` : ""}`,
	);

	return [...origins];
}
