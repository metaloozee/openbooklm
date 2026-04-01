"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileCode2Icon,
  FileIcon,
  FileTextIcon,
  FilesIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { useTRPC } from "@/lib/trpc/client";

const ACCEPTED_FILE_TYPES = [".pdf", ".txt", ".md", ".doc", ".docx"].join(",");
const ACCEPTED_FILE_TYPE_LABELS = ["PDF", "TXT", "MD", "DOC", "DOCX"];

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
    normalizedFilename.endsWith(".doc") ||
    normalizedFilename.endsWith(".docx")
  ) {
    return {
      Icon: FileTextIcon,
      label: normalizedFilename.endsWith(".txt") ? "TXT" : "DOC",
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

interface UploadDocumentsResult {
  failed: UploadFailure[];
  uploadedCount: number;
}

const uploadDocuments = async ({
  files,
  projectId,
}: {
  files: File[];
  projectId: string;
}): Promise<UploadDocumentsResult> => {
  const failed: UploadFailure[] = [];
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

      uploadedCount += 1;
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

      if (result.failed.length === 0) {
        toast.success("Documents uploaded", {
          description: `${result.uploadedCount} document(s) uploaded to this project.`,
        });
        return;
      }

      if (result.uploadedCount > 0) {
        toast.message("Some documents uploaded", {
          description: `${result.uploadedCount} uploaded, ${result.failed.length} failed.`,
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
        className="sm:max-w-xl"
        showCloseButton={!uploadDocumentsMutation.isPending}
      >
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Add source files to the project library.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
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
                    ? "Choose one or more files to build the project library."
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
                        accept={ACCEPTED_FILE_TYPES}
                        className="sr-only"
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          const selected = [...(event.target.files ?? [])];
                          field.handleChange(selected);
                        }}
                      />
                      <label
                        htmlFor={field.name}
                        className="group flex cursor-pointer flex-col gap-4 border border-dashed border-border bg-background px-4 py-4 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex size-9 items-center justify-center border border-border bg-muted/20">
                                <FilesIcon
                                  aria-hidden="true"
                                  className="size-4 text-foreground"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Curate your project library
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PDFs, notes, markdown, and Word documents.
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {summaryText}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 border border-border bg-muted/20 px-3 py-2 text-xs font-medium text-foreground">
                            <UploadIcon
                              aria-hidden="true"
                              className="size-3.5"
                            />
                            Choose files
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ACCEPTED_FILE_TYPE_LABELS.map((fileTypeLabel) => (
                            <span
                              key={fileTypeLabel}
                              className="inline-flex h-5 items-center border border-border bg-muted/20 px-2 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
                            >
                              {fileTypeLabel}
                            </span>
                          ))}
                        </div>
                      </label>
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
                  <div className="space-y-3 border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-foreground uppercase">
                          Selection
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {fileSummaryText}
                        </p>
                      </div>
                      {selectedFiles.length > 0 ? (
                        <span className="inline-flex h-5 items-center border border-border bg-muted/20 px-2 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                          Ready
                        </span>
                      ) : null}
                    </div>
                    {selectedFiles.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedFiles.map((file: File, index: number) => {
                          const { Icon, label } = getDocumentVisual(file.name);

                          return (
                            <li
                              key={`${file.name}-${file.size}`}
                              className="flex items-center justify-between gap-3 border border-border bg-muted/15 px-2.5 py-2"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-background">
                                  <Icon
                                    aria-hidden="true"
                                    className="size-4 text-foreground"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-foreground">
                                    {file.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span className="tracking-[0.14em] uppercase">
                                      {label}
                                    </span>
                                    <span>•</span>
                                    <span>{formatBytes(file.size)}</span>
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
                                      (_, selectedIndex) =>
                                        selectedIndex !== index
                                    )
                                  );
                                }}
                              >
                                <XIcon aria-hidden="true" />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    {selectedFiles.length > 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        You can remove individual files before adding them to
                        the library.
                      </p>
                    ) : null}
                  </div>
                );
              }}
            </form.Subscribe>
          </FieldGroup>

          <DialogFooter className="pt-1" showCloseButton>
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {(state) => (
                <Button
                  type="submit"
                  disabled={
                    !state.canSubmit ||
                    state.isSubmitting ||
                    uploadDocumentsMutation.isPending
                  }
                >
                  {state.isSubmitting || uploadDocumentsMutation.isPending
                    ? "Uploading..."
                    : "Add to Library"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
