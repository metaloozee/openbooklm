import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";

import { appSchema } from "./schema/app-schema";
import { authSchema } from "./schema/auth-schema";

export const getAuthDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema: authSchema });
});

export const getAuthDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema: authSchema });
});

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema: appSchema });
});

// Use in shared/async code paths for broader runtime safety.
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema: appSchema });
});
