import type { ResponseStyle } from "@/lib/settings";

export interface SettingsProfileValues {
  email: string;
  image: string;
  name: string;
  username: string;
}

export interface SettingsAiValues {
  citeSourcesByDefault: boolean;
  profileContext: string;
  responseStyle: ResponseStyle;
}
