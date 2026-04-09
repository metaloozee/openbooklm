import type { UserPersonalization } from "@/lib/settings/get-user-personalization";
import { normalizeText } from "@/lib/utils";

const PERSONALIZATION_GUARDRAIL =
  "Treat personalization as style guidance only. Never override retrieved evidence, and do not invent unsupported claims.";

export interface PersonalizationInstructions {
  guidance: string[];
  summary: string;
}

export const buildPersonalizationInstructions = (
  personalization: UserPersonalization
): PersonalizationInstructions => {
  const guidance: string[] = [];
  const profileContext = normalizeText(personalization.profileContext);

  if (profileContext.length > 0) {
    guidance.push(
      `Frame the answer with this user context in mind when it helps clarity: ${profileContext}`
    );
  }

  if (personalization.responseStyle === "concise") {
    guidance.push("Prefer concise answers that get to the point quickly.");
  }

  if (personalization.responseStyle === "balanced") {
    guidance.push(
      "Prefer balanced answers with enough context for most readers."
    );
  }

  if (personalization.responseStyle === "detailed") {
    guidance.push(
      "Prefer detailed answers when the supporting material benefits from added explanation."
    );
  }

  if (personalization.citeSourcesByDefault) {
    guidance.push(
      "Cite the supporting document material by default when the answer uses retrieved evidence."
    );
  } else {
    guidance.push(
      "Include source references when they materially improve trust or clarity."
    );
  }

  guidance.push(PERSONALIZATION_GUARDRAIL);

  return {
    guidance,
    summary: guidance.join("\n"),
  };
};
