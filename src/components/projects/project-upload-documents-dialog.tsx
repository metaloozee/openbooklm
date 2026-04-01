"use client";

import { useForm } from "@tanstack/react-form";
import { UploadIcon } from "lucide-react";
import { useState } from "react";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const ACCEPTED_FILE_TYPES = [".pdf", ".txt", ".md", ".doc", ".docx"].join(",");

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

export const ProjectUploadDocumentsDialog = ({
  disabled = false,
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
}: {
  disabled?: boolean;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);

    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
  };

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: ({ value }) => {
      if (value.files.length === 0) {
        toast.error("Add at least one document before continuing");
        return;
      }

      toast.message("Upload flow is coming soon", {
        description: `${value.files.length} document(s) ready for upload UI.`,
      });

      setOpen(false);
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
          disabled={disabled}
        >
          <UploadIcon aria-hidden="true" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Add files for this project. Upload processing will be connected
            soon.
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
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          const selected = [...(event.target.files ?? [])];
                          field.handleChange(selected);
                        }}
                      />
                      <FieldDescription>
                        Accepted types: PDF, TXT, MD, DOC, DOCX.
                      </FieldDescription>
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
                  <div className="border border-dashed border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium">Selection</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fileSummaryText}
                    </p>
                    {selectedFiles.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {selectedFiles.map((file: File) => (
                          <li key={`${file.name}-${file.size}`}>
                            {file.name} ({formatBytes(file.size)})
                          </li>
                        ))}
                      </ul>
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
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? "Saving..." : "Save Upload Draft"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
