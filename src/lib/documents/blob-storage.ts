import "server-only";
import { get, put } from "@vercel/blob";
import type {
  BlobAccessType,
  GetBlobResult,
  PutBlobResult,
} from "@vercel/blob";

const PRIMARY_BLOB_ACCESS_MODE: BlobAccessType = "public";

export const putDocumentBlob = (
  pathname: string,
  body: Parameters<typeof put>[1],
  options: Omit<Parameters<typeof put>[2], "access">
): Promise<PutBlobResult> =>
  put(pathname, body, {
    ...options,
    access: PRIMARY_BLOB_ACCESS_MODE,
  });

export const getDocumentBlob = (
  pathname: string
): Promise<GetBlobResult | null> =>
  get(pathname, {
    access: PRIMARY_BLOB_ACCESS_MODE,
  });
