import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { env } from "./env";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }

  return "http://localhost:3000";
};
