"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import {
  getUsernameValidationMessage,
  normalizeUsernameInput,
} from "@/lib/settings";
import { useTRPC } from "@/lib/trpc/client";

import { getFieldError, useWarnIfDirty } from "./form-utils";
import type { SettingsProfileValues } from "./types";

const getInitials = (name: string, email: string): string => {
  const source = name.trim() || email.trim() || "User";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const last = parts.at(-1);
    if (parts[0]?.[0] && last?.[0]) {
      return `${parts[0][0]}${last[0]}`.toUpperCase();
    }
  }

  return (source[0] ?? "U").toUpperCase();
};

export const ProfileSettingsForm = ({
  email,
  image,
  name,
  username,
}: SettingsProfileValues) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { refetch: refetchSession } = authClient.useSession();
  const [isDirty, setIsDirty] = useState(false);
  const [previewName, setPreviewName] = useState(name);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [usernameTone, setUsernameTone] = useState<
    "default" | "error" | "success"
  >("default");

  const updateProfileMutation = useMutation(
    trpc.settings.updateProfile.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Unable to update profile settings.");
      },
      onSuccess: async () => {
        await refetchSession();
        router.refresh();
        toast.success("Profile updated.");
      },
    })
  );

  const checkUsernameAvailability = async (nextUsername: string) => {
    const result = await queryClient.fetchQuery(
      trpc.settings.checkUsernameAvailability.queryOptions({
        username: nextUsername,
      })
    );

    setUsernameMessage(result.message);
    setUsernameTone(result.available ? "success" : "error");

    return result;
  };

  const form = useForm({
    defaultValues: {
      name,
      username,
    },
    onSubmit: async ({ value }) => {
      const trimmedName = value.name.trim();
      const normalizedUsername = normalizeUsernameInput(value.username ?? "");
      const usernameError = getUsernameValidationMessage(normalizedUsername);

      if (usernameError) {
        setUsernameMessage(usernameError);
        setUsernameTone("error");
        return;
      }

      if (
        normalizedUsername.length > 0 &&
        normalizedUsername !== (username ?? "")
      ) {
        const availability =
          await checkUsernameAvailability(normalizedUsername);

        if (!availability.available) {
          return;
        }
      }

      const updatedProfile = await updateProfileMutation.mutateAsync({
        name: trimmedName,
        username: normalizedUsername.length > 0 ? normalizedUsername : null,
      });
      const nextUsername = updatedProfile.username ?? "";

      form.reset({
        name: updatedProfile.name,
        username: nextUsername,
      });
      setIsDirty(false);
      setPreviewName(updatedProfile.name);
      setUsernameMessage("Profile updated.");
      setUsernameTone("success");
      await refetchSession();
      router.refresh();
      toast.success("Profile updated.");
    },
  });

  useWarnIfDirty(isDirty);

  const initials = getInitials(previewName, email);
  const isSaveDisabled = !isDirty || updateProfileMutation.isPending;
  let politeStatusText = "";

  if (updateProfileMutation.isPending) {
    politeStatusText = "Saving…";
  } else if (updateProfileMutation.isSuccess) {
    politeStatusText = "Saved.";
  } else if (updateProfileMutation.isError) {
    politeStatusText = "Save failed.";
  } else if (isDirty) {
    politeStatusText = "You have unsaved changes.";
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar size="lg" className="size-14">
          <AvatarImage alt={previewName || email} src={image ?? ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-foreground">
            {previewName.trim() || "Unnamed account"}
          </p>
          <p className="truncate text-sm text-muted-foreground" translate="no">
            {email}
          </p>
        </div>
      </div>

      <FieldGroup>
        <form.Field
          name="name"
          validators={{
            onBlur: ({ value }) => {
              if (value.trim().length === 0) {
                return "Display name is required.";
              }

              if (value.trim().length > 120) {
                return "Display name must be 120 characters or fewer.";
              }
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Display Name</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setIsDirty(true);
                    setPreviewName(nextValue);
                    field.handleChange(nextValue);
                  }}
                />
                <FieldError>
                  {getFieldError(field.state.meta.errors)}
                </FieldError>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field
          name="username"
          validators={{
            onBlur: ({ value }) =>
              getUsernameValidationMessage(value ?? "") ?? undefined,
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Username</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={field.state.value ?? ""}
                  onBlur={async () => {
                    field.handleBlur();
                    const normalized = normalizeUsernameInput(
                      field.state.value ?? ""
                    );
                    field.handleChange(normalized);

                    const validationError =
                      getUsernameValidationMessage(normalized);
                    if (validationError) {
                      setUsernameTone("error");
                      setUsernameMessage(validationError);
                      return;
                    }

                    if (normalized === (username ?? "")) {
                      setUsernameTone("success");
                      setUsernameMessage("This is your current username.");
                      return;
                    }

                    const result = await checkUsernameAvailability(normalized);
                    setUsernameTone(result.available ? "success" : "error");
                  }}
                  onChange={(event) => {
                    setIsDirty(true);
                    setUsernameMessage(null);
                    setUsernameTone("default");
                    field.handleChange(event.target.value);
                  }}
                />
                <FieldDescription>
                  Lowercase letters, numbers, hyphens, and underscores.
                </FieldDescription>
                <FieldError>
                  {getFieldError(field.state.meta.errors)}
                </FieldError>
                {usernameMessage ? (
                  <p
                    className={
                      usernameTone === "error"
                        ? "text-xs text-destructive"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {usernameMessage}
                  </p>
                ) : null}
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <Field>
          <FieldLabel htmlFor="settings-email">Email</FieldLabel>
          <FieldContent>
            <Input
              id="settings-email"
              name="email"
              autoComplete="email"
              disabled
              readOnly
              spellCheck={false}
              value={email}
            />
            <FieldDescription>
              Managed by your sign-in provider.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {politeStatusText}
        </p>
        <Button disabled={isSaveDisabled} type="submit">
          {updateProfileMutation.isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : null}
          Save Profile
        </Button>
      </div>
    </form>
  );
};
