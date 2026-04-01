import { getCloudflareContext } from "@opennextjs/cloudflare";

const nonWordFilenamePattern = /[^\w.-]+/g;
const repeatedDashPattern = /-+/g;
const edgeDashPattern = /^-+|-+$/g;
const dangerousContentTypes = new Set([
  "application/xhtml+xml",
  "application/xml",
  "image/svg+xml",
  "text/html",
  "text/xml",
]);

const documentUploadPolicies = {
  doc: {
    canonicalContentType: "application/msword",
    previewable: false,
  },
  docx: {
    canonicalContentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    previewable: false,
  },
  md: {
    canonicalContentType: "text/markdown",
    previewable: true,
  },
  pdf: {
    canonicalContentType: "application/pdf",
    previewable: true,
  },
  txt: {
    canonicalContentType: "text/plain",
    previewable: true,
  },
} as const;

type DocumentUploadExtension = keyof typeof documentUploadPolicies;

const getDocumentExtension = (
  filename: string
): DocumentUploadExtension | null => {
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return null;
  }

  const extension = filename.slice(lastDotIndex + 1).toLowerCase();

  if (extension in documentUploadPolicies) {
    return extension as DocumentUploadExtension;
  }

  return null;
};

const sanitizeFilename = (filename: string): string => {
  const sanitized = filename
    .trim()
    .replace(nonWordFilenamePattern, "-")
    .replace(repeatedDashPattern, "-")
    .replace(edgeDashPattern, "");

  return sanitized.length > 0 ? sanitized : "file";
};

export const createDocumentObjectKey = (filename: string): string =>
  `uploads/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;

export const getDocumentUploadPolicy = (
  filename: string
): (typeof documentUploadPolicies)[DocumentUploadExtension] | null => {
  const extension = getDocumentExtension(filename);

  return extension ? documentUploadPolicies[extension] : null;
};

export const resolveDocumentUploadContentType = (
  filename: string,
  providedContentType: string
): string | null => {
  const policy = getDocumentUploadPolicy(filename);

  if (!policy) {
    return null;
  }

  const normalizedContentType = providedContentType.trim().toLowerCase();

  if (dangerousContentTypes.has(normalizedContentType)) {
    return null;
  }

  return policy.canonicalContentType;
};

export const getSafeDocumentResponseContentType = (
  contentType: string | null
): string => {
  const normalizedContentType = contentType?.trim().toLowerCase() ?? "";

  for (const policy of Object.values(documentUploadPolicies)) {
    if (policy.canonicalContentType === normalizedContentType) {
      return policy.canonicalContentType;
    }
  }

  return "application/octet-stream";
};

export const canRenderDocumentInline = (
  contentType: string | null
): boolean => {
  const normalizedContentType = contentType?.trim().toLowerCase() ?? "";

  for (const policy of Object.values(documentUploadPolicies)) {
    if (policy.canonicalContentType === normalizedContentType) {
      return policy.previewable;
    }
  }

  return false;
};

export const getDocumentsBucket = async (): Promise<R2Bucket> => {
  const { env } = await getCloudflareContext({ async: true });
  return env.DOCUMENTS_BUCKET;
};
