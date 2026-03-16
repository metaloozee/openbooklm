import { env } from "@openbooklm/env/web";

export function getServerUrl() {
	if (typeof window === "undefined") {
		return env.NEXT_PUBLIC_SERVER_URL;
	}

	const configuredUrl = new URL(env.NEXT_PUBLIC_SERVER_URL);
	configuredUrl.hostname = window.location.hostname;

	return configuredUrl.toString();
}
