import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { DEFAULT_AI_SETTINGS, isResponseStyle } from "@/lib/settings";
import type { ResponseStyle } from "@/lib/settings";

export interface UserPersonalization {
  citeSourcesByDefault: boolean;
  profileContext: string;
  responseStyle: ResponseStyle;
}

export const getUserPersonalization = async ({
  userId,
}: {
  userId: string;
}): Promise<UserPersonalization> => {
  const [settingsRecord] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return {
    citeSourcesByDefault:
      settingsRecord?.citeSourcesByDefault ??
      DEFAULT_AI_SETTINGS.citeSourcesByDefault,
    profileContext:
      settingsRecord?.profileContext ?? DEFAULT_AI_SETTINGS.profileContext,
    responseStyle: isResponseStyle(settingsRecord?.responseStyle ?? "")
      ? (settingsRecord.responseStyle as ResponseStyle)
      : DEFAULT_AI_SETTINGS.responseStyle,
  };
};
