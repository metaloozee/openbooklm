import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";

export const db = drizzle({ connection: env.DATABASE_URL, schema, ws: ws });
