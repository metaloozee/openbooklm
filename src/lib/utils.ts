import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const REGEX_SPLIT_WORDS = /\s+/;

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

export const normalizeText = (value: string) =>
  value
    .replaceAll("\r\n", "\n")
    .replaceAll(/[ \t]+\n/g, "\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .replaceAll(/[ \t]{2,}/g, " ")
    .trim();

export const generateChunks = ({
  input,
  wordsPerChunk = 250,
}: {
  input: string;
  wordsPerChunk?: number;
}): string[] => {
  if (!input || typeof input !== "string") {
    return [];
  }

  const trimmed = input.trim();
  if (trimmed === "") {
    return [];
  }

  const words = trimmed.split(REGEX_SPLIT_WORDS);

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let wordCount = 0;

  for (const word of words) {
    currentChunk.push(word);
    wordCount += 1;

    if (wordCount === wordsPerChunk) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
      wordCount = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
};
