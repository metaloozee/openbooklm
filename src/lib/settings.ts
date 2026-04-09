export const RESPONSE_STYLE_VALUES = [
  "concise",
  "balanced",
  "detailed",
] as const;

export type ResponseStyle = (typeof RESPONSE_STYLE_VALUES)[number];

export const RESPONSE_STYLE_OPTIONS: readonly {
  description: string;
  label: string;
  value: ResponseStyle;
}[] = [
  {
    description: "Short answers that get to the point quickly.",
    label: "Concise",
    value: "concise",
  },
  {
    description: "Default depth with enough context for most questions.",
    label: "Balanced",
    value: "balanced",
  },
  {
    description:
      "More explanation and detail when the answer benefits from it.",
    label: "Detailed",
    value: "detailed",
  },
] as const;

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 32;
export const MAX_PROFILE_CONTEXT_LENGTH = 2000;
export const USERNAME_PATTERN = /^[a-z0-9_][a-z0-9_-]{2,31}$/;

export const DEFAULT_AI_SETTINGS = {
  citeSourcesByDefault: true,
  profileContext: "",
  responseStyle: "balanced" as ResponseStyle,
};

export const normalizeUsernameInput = (value: string): string =>
  value.trim().toLowerCase();

export const getUsernameValidationMessage = (value: string): string | null => {
  const normalized = normalizeUsernameInput(value);

  if (normalized.length === 0) {
    return null;
  }

  if (normalized.length < MIN_USERNAME_LENGTH) {
    return `Username must be at least ${MIN_USERNAME_LENGTH} characters.`;
  }

  if (normalized.length > MAX_USERNAME_LENGTH) {
    return `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`;
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return "Use lowercase letters, numbers, underscores, or hyphens.";
  }

  return null;
};

export const isResponseStyle = (value: string): value is ResponseStyle =>
  RESPONSE_STYLE_VALUES.includes(value as ResponseStyle);
