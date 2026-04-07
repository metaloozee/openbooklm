const DOCUMENT_FILE_EXTENSION_REGEX = /\.[^.]+$/;

const TEXT_DOCUMENT_EXTENSIONS = new Set([".md", ".txt"]);
const PDF_CONTENT_TYPES = new Set(["application/pdf"]);
const DOCX_CONTENT_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MARKDOWN_CONTENT_TYPES = new Set([
  "text/markdown",
  "text/x-markdown",
  "text/plain",
]);
const TEXT_CONTENT_TYPES = new Set(["text/plain"]);

export const SUPPORTED_DOCUMENT_FILE_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".md",
  ".docx",
] as const;

const SUPPORTED_DOCUMENT_FILE_EXTENSION_SET = new Set<string>(
  SUPPORTED_DOCUMENT_FILE_EXTENSIONS
);

export const SUPPORTED_DOCUMENT_FILE_TYPE_LABELS = [
  "PDF",
  "TXT",
  "MD",
  "DOCX",
] as const;

export const SUPPORTED_DOCUMENT_FILE_TYPES_ATTRIBUTE =
  SUPPORTED_DOCUMENT_FILE_EXTENSIONS.join(",");

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const getFilenameExtension = (filename: string): string | null => {
  const normalizedFilename = filename.trim().toLowerCase();
  const match = normalizedFilename.match(DOCUMENT_FILE_EXTENSION_REGEX);

  return match?.[0] ?? null;
};

export const isTextDocumentFile = ({
  contentType,
  filename,
}: {
  contentType: string | null;
  filename: string;
}): boolean => {
  const normalizedContentType = contentType?.trim().toLowerCase() ?? "";
  const extension = getFilenameExtension(filename);

  if (extension && TEXT_DOCUMENT_EXTENSIONS.has(extension)) {
    return true;
  }

  return normalizedContentType.startsWith("text/");
};

const isSupportedDocumentContentType = ({
  contentType,
  extension,
}: {
  contentType: string | null;
  extension: string;
}): boolean => {
  if (!contentType) {
    return true;
  }

  const normalizedContentType =
    contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";

  switch (extension) {
    case ".pdf": {
      return PDF_CONTENT_TYPES.has(normalizedContentType);
    }
    case ".docx": {
      return DOCX_CONTENT_TYPES.has(normalizedContentType);
    }
    case ".md": {
      return MARKDOWN_CONTENT_TYPES.has(normalizedContentType);
    }
    case ".txt": {
      return TEXT_CONTENT_TYPES.has(normalizedContentType);
    }
    default: {
      return false;
    }
  }
};

export const validateDocumentUpload = ({
  contentType,
  filename,
  sizeBytes,
}: {
  contentType: string | null;
  filename: string;
  sizeBytes: number;
}): string | null => {
  const extension = getFilenameExtension(filename);

  if (!extension || !SUPPORTED_DOCUMENT_FILE_EXTENSION_SET.has(extension)) {
    return "Unsupported file type. Upload a PDF, TXT, MD, or DOCX file.";
  }

  if (
    !isSupportedDocumentContentType({
      contentType,
      extension,
    })
  ) {
    return "The uploaded file content type does not match its extension.";
  }

  if (sizeBytes > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return "Document is too large. Upload a file smaller than 50 MB.";
  }

  return null;
};
