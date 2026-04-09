"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
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
        toast.error(error.message || "Unable to create project");
      },
      onSuccess: async () => {
        toast.success("Project created");
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
        className="sm:max-w-md"
        showCloseButton={!createProjectMutation.isPending}
      >
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Start a new project workspace for your documents, chats, and notes.
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
              name="name"
              validators={{
                onBlur: ({ value }) => {
                  if (value.trim().length === 0) {
                    return "Project name is required";
                  }

                  if (value.trim().length > 120) {
                    return "Project name must be 120 characters or fewer";
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
                    return "Slug is required";
                  }

                  if (!SLUG_REGEX.test(value.trim())) {
                    return "Use lowercase letters, numbers, and hyphens only";
                  }
                },
              }}
            >
              {(field) => {
                const error = getFieldError(field.state.meta.errors);

                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        autoComplete="off"
                        placeholder="e.g. research-sprint…"
                        spellCheck={false}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(toSlug(event.target.value));
                        }}
                      />
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
                    return "Description must be 5000 characters or fewer";
                  }
                },
              }}
            >
              {(field) => {
                const error = getFieldError(field.state.meta.errors);

                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Description (Optional)
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        autoComplete="off"
                        placeholder="What is this project about…"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                        }}
                      />
                      <FieldError>{error}</FieldError>
                    </FieldContent>
                  </Field>
                );
              }}
            </form.Field>
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

          <p aria-live="polite" className="sr-only">
            {politeStatusText}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
