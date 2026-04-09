"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import type { SettingsProfileValues } from "./types";

const getFieldError = (errors: unknown[]): string | null => {
  for (const error of errors) {
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
  }

  return null;
};

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
        toast.success("Profile settings updated");
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
      setUsernameMessage(
        nextUsername.length > 0
          ? "Profile updated."
          : "Profile updated. Add a username later whenever you want one."
      );
      setUsernameTone("success");
      await refetchSession();
      router.refresh();
      toast.success("Profile settings updated");
    },
  });

  const initials = useMemo(
    () => getInitials(previewName, email),
    [email, previewName]
  );

  const politeStatusText = useMemo(() => {
    if (updateProfileMutation.isPending) {
      return "Saving profile settings...";
    }

    if (updateProfileMutation.isSuccess) {
      return "Profile settings saved.";
    }

    if (updateProfileMutation.isError) {
      return "Profile settings save failed.";
    }

    return "";
  }, [
    updateProfileMutation.isError,
    updateProfileMutation.isPending,
    updateProfileMutation.isSuccess,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage how your account appears across the app.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3 border border-dashed border-border p-3">
            <Avatar size="lg">
              <AvatarImage alt={previewName || email} src={image ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">Google profile image</p>
              <p className="text-xs text-muted-foreground">
                Your avatar currently comes from Google sign-in and cannot be
                changed here yet.
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
                  <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      autoComplete="name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        const nextValue = event.target.value;
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
                      autoCorrect="off"
                      placeholder="your-handle"
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

                        const result =
                          await checkUsernameAvailability(normalized);
                        setUsernameTone(result.available ? "success" : "error");
                      }}
                      onChange={(event) => {
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
                <Input id="settings-email" value={email} readOnly disabled />
                <FieldDescription>
                  Managed by Google sign-in and not editable from this page.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {politeStatusText}
          </p>
          <Button disabled={updateProfileMutation.isPending} type="submit">
            {updateProfileMutation.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : null}
            Save profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
