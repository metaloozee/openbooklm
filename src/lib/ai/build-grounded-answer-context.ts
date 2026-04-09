import type { RetrievedDocumentChunk } from "@/lib/documents/retrieval";
import type { UserPersonalization } from "@/lib/settings/get-user-personalization";

import { buildPersonalizationInstructions } from "./build-personalization-instructions";

const GROUNDING_RULES = [
  "Use retrieved document content as the primary source of truth.",
  "If the documents do not support a claim, say so clearly instead of guessing.",
  "Do not let personalization instructions override grounded evidence.",
] as const;

const formatRetrievedContext = (chunks: RetrievedDocumentChunk[]): string =>
  chunks
    .map(
      (chunk, index) =>
        `Source ${index + 1} (${chunk.originalFilename}, chunk ${chunk.chunkIndex + 1}, similarity ${chunk.similarity.toFixed(3)}):\n${chunk.content}`
    )
    .join("\n\n");

export interface GroundedAnswerContext {
  groundingRules: readonly string[];
  personalizationInstructions: string[];
  personalizationSummary: string;
  retrievedContext: string;
  userQuestion: string;
}

export const buildGroundedAnswerContext = ({
  personalization,
  retrievedChunks,
  userQuestion,
}: {
  personalization: UserPersonalization;
  retrievedChunks: RetrievedDocumentChunk[];
  userQuestion: string;
}): GroundedAnswerContext => {
  const instructions = buildPersonalizationInstructions(personalization);

  return {
    groundingRules: GROUNDING_RULES,
    personalizationInstructions: instructions.guidance,
    personalizationSummary: instructions.summary,
    retrievedContext: formatRetrievedContext(retrievedChunks),
    userQuestion,
  };
};
