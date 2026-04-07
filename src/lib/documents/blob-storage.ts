import "server-only";
import { get, put } from "@vercel/blob";
import type {
  BlobAccessType,
  GetBlobResult,
  PutBlobResult,
} from "@vercel/blob";

const BLOB_ACCESS_MODES: readonly BlobAccessType[] = ["private", "public"];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Unknown Blob storage error";
};

export const putDocumentBlob = async (
  pathname: string,
  body: Parameters<typeof put>[1],
  options: Omit<Parameters<typeof put>[2], "access">
): Promise<PutBlobResult> => {
  let lastError: unknown;

  for (const access of BLOB_ACCESS_MODES) {
    try {
      return await put(pathname, body, {
        ...options,
        access,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(getErrorMessage(lastError));
};

export const getDocumentBlob = async (
  pathname: string
): Promise<GetBlobResult | null> => {
  let lastError: unknown;

  for (const access of BLOB_ACCESS_MODES) {
    try {
      const result = await get(pathname, {
        access,
      });

      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error(getErrorMessage(lastError));
  }

  return null;
};
