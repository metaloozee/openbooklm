"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/lib/trpc/client";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

const getFieldError = (errors: unknown[]): string | null => {
  for (const error of errors) {
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
  }

  return null;
};

export const NewProjectDialog = ({
  onProjectCreated,
}: {
  onProjectCreated?: () => Promise<void> | void;
}) => {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const createProjectMutation = useMutation(
    trpc.project.createProject.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Unable to create project.");
      },
      onSuccess: async () => {
        toast.success("Project created.");
        await onProjectCreated?.();
      },
    })
  );

  const form = useForm({
    defaultValues: {
      description: "",
      name: "",
      slug: "",
    },
    onSubmit: async ({ value }) => {
      await createProjectMutation.mutateAsync({
        description:
          value.description.trim().length > 0
            ? value.description.trim()
            : undefined,
        name: value.name.trim(),
        slug: value.slug.trim(),
      });

      form.reset();
      setOpen(false);
    },
  });

  const politeStatusText = useMemo(() => {
    if (createProjectMutation.isPending) {
      return "Creating project…";
    }

    if (createProjectMutation.isSuccess) {
      return "Project created.";
    }

    if (createProjectMutation.isError) {
      return "Project creation failed.";
    }

    return "";
  }, [
    createProjectMutation.isError,
    createProjectMutation.isPending,
    createProjectMutation.isSuccess,
  ]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size={isMobile ? "icon" : "default"}>
          <PlusIcon aria-hidden="true" />
          {!isMobile && "New Project"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-xl"
        showCloseButton={!createProjectMutation.isPending}
      >
        <DialogHeader className="gap-3 border-b border-dashed border-border pb-5 pr-8">
          <Badge variant="outline" className="tracking-[0.18em] uppercase">
            New Project
          </Badge>
          <div className="space-y-1">
            <DialogTitle className="text-base">
              Start a New Workspace
            </DialogTitle>
            <DialogDescription className="max-w-lg text-sm text-muted-foreground">
              A project keeps one topic, one client, or one research thread in
              one place so your documents stay easy to find later.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="rounded-none border border-dashed border-border bg-muted/20 p-4">
            <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
              Good naming rule
            </p>
            <p className="mt-2 text-sm text-foreground">
              Name the project after the question you want to keep separate —
              for example a client, a deal, or a research theme.
            </p>
          </div>

          <FieldGroup>
            <form.Field
              name="name"
              validators={{
                onBlur: ({ value }) => {
                  if (value.trim().length === 0) {
                    return "Project name is required.";
                  }

                  if (value.trim().length > 120) {
                    return "Project name must be 120 characters or fewer.";
                  }
                },
              }}
            >
              {(field) => {
                const error = getFieldError(field.state.meta.errors);

                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Project Name</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        autoComplete="off"
                        placeholder="e.g. Research Sprint…"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          const { value } = event.target;
                          field.handleChange(value);

                          if (form.getFieldValue("slug").length === 0) {
                            form.setFieldValue("slug", toSlug(value));
                          }
                        }}
                      />
                      <FieldDescription>
                        This is the plain-language title you will scan in the
                        dashboard.
                      </FieldDescription>
                      <FieldError>{error}</FieldError>
                    </FieldContent>
                  </Field>
                );
              }}
            </form.Field>

            <form.Field
              name="slug"
              validators={{
                onBlur: ({ value }) => {
                  if (value.trim().length === 0) {
                    return "Slug is required.";
                  }

                  if (!SLUG_REGEX.test(value.trim())) {
                    return "Use lowercase letters, numbers, and hyphens only.";
                  }
                },
              }}
            >
              {(field) => {
                const error = getFieldError(field.state.meta.errors);

                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Project Link</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        placeholder="e.g. research-sprint…"
                        spellCheck={false}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(toSlug(event.target.value));
                        }}
                      />
                      <FieldDescription>
                        This becomes the clean URL for the workspace. Keep it
                        short and readable.
                      </FieldDescription>
                      <FieldError>{error}</FieldError>
                    </FieldContent>
                  </Field>
                );
              }}
            </form.Field>

            <form.Field
              name="description"
              validators={{
                onBlur: ({ value }) => {
                  if (value.trim().length > 5000) {
                    return "Description must be 5000 characters or fewer.";
                  }
                },
              }}
            >
              {(field) => {
                const error = getFieldError(field.state.meta.errors);

                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Short Note</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        autoComplete="off"
                        placeholder="What will live in this project…"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                        }}
                      />
                      <FieldDescription>
                        Optional, but useful when you want future-you to know
                        what belongs here.
                      </FieldDescription>
                      <FieldError>{error}</FieldError>
                    </FieldContent>
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <DialogFooter className="flex flex-col items-start gap-3 border-t border-dashed border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {politeStatusText}
            </p>
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
                    createProjectMutation.isPending
                  }
                >
                  {state.isSubmitting || createProjectMutation.isPending
                    ? "Creating…"
                    : "Create Project"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
