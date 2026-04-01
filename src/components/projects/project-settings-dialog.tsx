"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";

interface ProjectSettingsDialogProject {
  description: string | null;
  id: string;
  name: string;
  slug: string;
}

const getFieldError = (errors: unknown[]): string | null => {
  for (const error of errors) {
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
  }

  return null;
};

const getDefaultValues = (project?: ProjectSettingsDialogProject) => ({
  description: project?.description ?? "",
  name: project?.name ?? "",
});

export const ProjectSettingsDialog = ({
  project,
  projectSlug,
  disabled = false,
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
}: {
  project?: ProjectSettingsDialogProject;
  projectSlug: string;
  disabled?: boolean;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);

    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
  };

  const projectQueryOptions = useMemo(
    () =>
      trpc.project.getProjectBySlug.queryOptions({
        slug: projectSlug,
      }),
    [projectSlug, trpc]
  );

  const projectListQueryOptions = useMemo(
    () =>
      trpc.project.listProjects.queryOptions({
        includeArchived: false,
      }),
    [trpc]
  );

  const updateProjectMutation = useMutation(
    trpc.project.updateProject.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Unable to update project settings");
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: projectQueryOptions.queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: projectListQueryOptions.queryKey,
          }),
        ]);
        toast.success("Project settings updated");
      },
    })
  );

  const form = useForm({
    defaultValues: getDefaultValues(project),
    onSubmit: async ({ value }) => {
      if (!project) {
        toast.error("Project details are still loading");
        return;
      }

      await updateProjectMutation.mutateAsync({
        description:
          value.description.trim().length > 0 ? value.description.trim() : null,
        id: project.id,
        name: value.name.trim(),
      });

      setOpen(false);
    },
  });

  const politeStatusText = useMemo(() => {
    if (updateProjectMutation.isPending) {
      return "Saving project settings...";
    }

    if (updateProjectMutation.isSuccess) {
      return "Project settings saved.";
    }

    if (updateProjectMutation.isError) {
      return "Project settings save failed.";
    }

    return "";
  }, [
    updateProjectMutation.isError,
    updateProjectMutation.isPending,
    updateProjectMutation.isSuccess,
  ]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        form.reset(getDefaultValues(project));
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName}
          disabled={disabled || updateProjectMutation.isPending}
        >
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!updateProjectMutation.isPending}
      >
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Update your project name and description. The slug cannot be
            changed.
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
            <Field>
              <FieldLabel htmlFor="project-settings-slug">Slug</FieldLabel>
              <FieldContent>
                <Input
                  id="project-settings-slug"
                  value={project?.slug ?? projectSlug}
                  readOnly
                  disabled
                />
                <FieldDescription>
                  The project slug is fixed once created.
                </FieldDescription>
              </FieldContent>
            </Field>

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
                        placeholder="e.g. Research Sprint..."
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
                        placeholder="What is this project about..."
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
                    updateProjectMutation.isPending
                  }
                >
                  {state.isSubmitting || updateProjectMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
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
