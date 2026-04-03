import { and, eq } from "drizzle-orm";

import { getDbAsync } from "@/lib/db";
import { project } from "@/lib/db/schema";

export const getProjectBySlugForUser = async (
  ownerUserId: string,
  slug: string
) => {
  const db = await getDbAsync();
  const [row] = await db
    .select()
    .from(project)
    .where(and(eq(project.ownerUserId, ownerUserId), eq(project.slug, slug)))
    .limit(1);

  return row ?? null;
};
