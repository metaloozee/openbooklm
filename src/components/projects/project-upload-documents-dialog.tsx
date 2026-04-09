"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileCode2Icon,
  FileIcon,
  FileTextIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { mergeProjectDocumentList } from "@/components/projects/project-document-list-shared";
import type { ProjectDocumentListItem } from "@/components/projects/project-document-list-shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SUPPORTED_DOCUMENT_FILE_TYPE_LABELS,
  SUPPORTED_DOCUMENT_FILE_TYPES_ATTRIBUTE,
} from "@/lib/documents/file-types";
import { useTRPC } from "@/lib/trpc/client";

const getFieldError = (errors: unknown[]): string | null => {
  for (const error of errors) {
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
  }

  return null;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(1)} MB`;
};

const totalFileSize = (files: File[]): number => {
  let total = 0;

  for (const file of files) {
    total += file.size;
  }

  return total;
};

const getDefaultValues = () => ({
  files: [] as File[],
});

const getDocumentVisual = (
  filename: string
): {
  Icon: typeof FileIcon;
  label: string;
} => {
  const normalizedFilename = filename.toLowerCase();

  if (normalizedFilename.endsWith(".pdf")) {
    return {
      Icon: FileIcon,
      label: "PDF",
    };
  }

  if (normalizedFilename.endsWith(".md")) {
    return {
      Icon: FileCode2Icon,
      label: "MD",
    };
  }

  if (
    normalizedFilename.endsWith(".txt") ||
    normalizedFilename.endsWith(".docx")
  ) {
    return {
      Icon: FileTextIcon,
      label: normalizedFilename.endsWith(".txt") ? "TXT" : "DOCX",
    };
  }

  return {
    Icon: FileIcon,
    label: "FILE",
  };
};

interface UploadFailure {
  error: string;
  file: File;
}

interface UploadedDocumentPayload extends Omit<
  ProjectDocumentListItem,
  "createdAt" | "lastIngestionAttemptAt" | "processedAt" | "processingStartedAt"
> {
  createdAt: string;
  lastIngestionAttemptAt: string | null;
  processedAt: string | null;
  processingStartedAt: string | null;
}

interface UploadDocumentsResult {
  failed: UploadFailure[];
  uploadedCount: number;
  uploadedDocuments: ProjectDocumentListItem[];
}

const toProjectDocumentListItem = (
  payload: UploadedDocumentPayload
): ProjectDocumentListItem => ({
  ...payload,
  createdAt: new Date(payload.createdAt),
  lastIngestionAttemptAt: payload.lastIngestionAttemptAt
    ? new Date(payload.lastIngestionAttemptAt)
    : null,
  processedAt: payload.processedAt ? new Date(payload.processedAt) : null,
  processingStartedAt: payload.processingStartedAt
    ? new Date(payload.processingStartedAt)
    : null,
});

const uploadDocuments = async ({
  files,
  onUploadedDocument,
  projectId,
}: {
  files: File[];
  onUploadedDocument?: (document: ProjectDocumentListItem) => void;
  projectId: string;
}): Promise<UploadDocumentsResult> => {
  const failed: UploadFailure[] = [];
  const uploadedDocuments: ProjectDocumentListItem[] = [];
  let uploadedCount = 0;

  for (const file of files) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("projectId", projectId);

    try {
      const response = await fetch("/api/documents", {
        body: formData,
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        failed.push({
          error: payload?.error || `Upload failed for ${file.name}`,
          file,
        });
        continue;
      }

      const payload = (await response.json()) as UploadedDocumentPayload;
      const uploadedDocument = toProjectDocumentListItem(payload);
      uploadedDocuments.push(uploadedDocument);
      uploadedCount += 1;
      onUploadedDocument?.(uploadedDocument);
    } catch {
      failed.push({
        error: `Upload failed for ${file.name}`,
        file,
      });
    }
  }

  return {
    failed,
    uploadedCount,
    uploadedDocuments,
  };
};

export const ProjectUploadDocumentsDialog = ({
  projectId,
  disabled = false,
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
}: {
  projectId?: string;
  disabled?: boolean;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const projectDocumentsQueryOptions = useMemo(
    () =>
      projectId
        ? trpc.project.listProjectDocuments.queryOptions({
            projectId,
          })
        : null,
    [projectId, trpc]
  );

  const pushUploadedDocument = (document: ProjectDocumentListItem) => {
    if (!projectDocumentsQueryOptions) {
      return;
    }

    queryClient.setQueryData<ProjectDocumentListItem[]>(
      projectDocumentsQueryOptions.queryKey,
      (currentDocuments) =>
        mergeProjectDocumentList(currentDocuments, [document])
    );
  };

  const uploadDocumentsMutation = useMutation({
    mutationFn: uploadDocuments,
    onError: (error) => {
      toast.error(error.message || "Unable to upload documents");
    },
    onSuccess: async (result) => {
      if (projectDocumentsQueryOptions && result.uploadedCount > 0) {
        await queryClient.invalidateQueries({
          queryKey: projectDocumentsQueryOptions.queryKey,
        });
      }

      const processingDocumentsCount = result.uploadedDocuments.filter(
        (document) => document.processingStatus !== "failed"
      ).length;
      const failedToStartCount =
        result.uploadedDocuments.length - processingDocumentsCount;

      if (result.failed.length === 0 && failedToStartCount === 0) {
        toast.success("Documents uploaded", {
          description: `${processingDocumentsCount} document(s) uploaded and background processing started.`,
        });
        return;
      }

      if (result.uploadedCount > 0) {
        toast.message("Uploads finished", {
          description: `${processingDocumentsCount} processing, ${failedToStartCount} failed to start background work, ${result.failed.length} upload failed.`,
        });
        return;
      }

      toast.error("No documents uploaded", {
        description: result.failed[0]?.error ?? "Unable to upload documents.",
      });
    },
  });

  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);

    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
  };

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      if (value.files.length === 0) {
        toast.error("Add at least one document before continuing");
        return;
      }

      if (!projectId) {
        toast.error("Project details are still loading");
        return;
      }

      const result = await uploadDocumentsMutation.mutateAsync({
        files: value.files,
        onUploadedDocument: pushUploadedDocument,
        projectId,
      });

      if (result.failed.length === 0) {
        setOpen(false);
        return;
      }

      form.setFieldValue(
        "files",
        result.failed.map((failedUpload) => failedUpload.file)
      );
    },
  });

  const acceptedFileTypesText = SUPPORTED_DOCUMENT_FILE_TYPE_LABELS.join(", ");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        form.reset(getDefaultValues());
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName}
          disabled={disabled || uploadDocumentsMutation.isPending}
        >
          <UploadIcon aria-hidden="true" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!uploadDocumentsMutation.isPending}
      >
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Add source files to your project library.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="files"
              validators={{
                onBlur: ({ value }) => {
                  if (value.length === 0) {
                    return "Select at least one file";
                  }
                },
              }}
            >
              {(field) => {
                const error = getFieldError(field.state.meta.errors);
                const fileCount = field.state.value.length;
                const summaryText =
                  fileCount === 0
                    ? "No files selected"
                    : `${fileCount} selected • ${formatBytes(totalFileSize(field.state.value))}`;

                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Documents</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="file"
                        multiple
                        accept={SUPPORTED_DOCUMENT_FILE_TYPES_ATTRIBUTE}
                        className="sr-only"
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          const selected = [...(event.target.files ?? [])];
                          field.handleChange(selected);
                          event.currentTarget.value = "";
                        }}
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            {summaryText}
                          </p>
                          <label
                            htmlFor={field.name}
                            className="inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-none border border-border bg-background px-2.5 text-xs font-medium whitespace-nowrap hover:bg-muted focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                const targetInput = event.currentTarget.control;
                                if (targetInput instanceof HTMLInputElement) {
                                  targetInput.click();
                                }
                              }
                            }}
                          >
                            <UploadIcon
                              aria-hidden="true"
                              className="size-3.5"
                            />
                            Choose Files
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Supported: {acceptedFileTypesText}
                        </p>
                      </div>
                      <FieldError>{error}</FieldError>
                    </FieldContent>
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.files}>
              {(selectedFiles) => {
                const fileSummaryText =
                  selectedFiles.length === 0
                    ? "No files selected"
                    : `${selectedFiles.length} file(s), ${formatBytes(totalFileSize(selectedFiles))} total`;

                return (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {fileSummaryText}
                    </p>

                    {selectedFiles.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Choose files to preview what will be uploaded.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {selectedFiles.map((file, index) => {
                          const { Icon, label } = getDocumentVisual(file.name);

                          return (
                            <li
                              key={`${file.name}-${file.size}-${index}`}
                              className="flex items-start justify-between gap-2 py-2"
                            >
                              <div className="flex min-w-0 items-start gap-2">
                                <div className="flex size-7 shrink-0 items-center justify-center">
                                  <Icon
                                    aria-hidden="true"
                                    className="size-3.5 text-muted-foreground"
                                  />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {file.name}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatBytes(file.size)}</span>
                                    <span aria-hidden="true">•</span>
                                    <span>{label}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`Remove ${file.name}`}
                                onClick={() => {
                                  form.setFieldValue(
                                    "files",
                                    selectedFiles.filter(
                                      (_, fileIndex) => fileIndex !== index
                                    )
                                  );
                                }}
                              >
                                <XIcon
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              }}
            </form.Subscribe>
          </FieldGroup>

          <DialogFooter className="pt-1">
            <Button type="submit" disabled={uploadDocumentsMutation.isPending}>
              <UploadIcon aria-hidden="true" />
              {uploadDocumentsMutation.isPending
                ? "Uploading…"
                : "Upload Documents"}
            </Button>
          </DialogFooter>

          <p aria-live="polite" className="sr-only">
            {uploadDocumentsMutation.isPending
              ? "Uploading documents…"
              : "Ready to upload documents."}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
