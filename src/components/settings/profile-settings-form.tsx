"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
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
        toast.success("Profile settings updated.");
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
      setUsernameMessage(
        nextUsername.length > 0
          ? "Profile updated."
          : "Profile updated. Add a username whenever you want one."
      );
      setUsernameTone("success");
      await refetchSession();
      router.refresh();
      toast.success("Profile settings updated.");
    },
  });

  useWarnIfDirty(isDirty);

  const initials = getInitials(previewName, email);
  const isSaveDisabled = !isDirty || updateProfileMutation.isPending;

  const politeStatusText = (() => {
    if (updateProfileMutation.isPending) {
      return "Saving profile settings…";
    }

    if (updateProfileMutation.isSuccess) {
      return "Profile settings saved.";
    }

    if (updateProfileMutation.isError) {
      return "Profile settings save failed.";
    }

    return isDirty ? "You have unsaved profile changes." : "";
  })();

  return (
    <Card className="border border-dashed border-border/80 bg-background">
      <CardHeader className="gap-3 border-b border-dashed border-border/80 pb-5">
        <Badge variant="outline" className="tracking-[0.18em] uppercase">
          Profile
        </Badge>
        <div className="space-y-1">
          <h2 className="font-heading text-base font-medium">
            How People Recognize You
          </h2>
          <CardDescription className="max-w-2xl text-sm text-muted-foreground">
            Keep your account easy to identify. These details show up in menus,
            workspace surfaces, and future answer views.
          </CardDescription>
        </div>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <CardContent className="space-y-6 pt-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 gap-4 border border-dashed border-border/80 bg-muted/20 p-4">
              <Avatar size="lg" className="size-14">
                <AvatarImage alt={previewName || email} src={image ?? ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-2">
                <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                  Live preview
                </p>
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-foreground">
                    {previewName.trim() || "Unnamed account"}
                  </p>
                  <p
                    className="truncate text-sm text-muted-foreground"
                    translate="no"
                  >
                    {email}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your avatar currently comes from{" "}
                  <span translate="no">Google</span> sign-in.
                </p>
              </div>
            </div>

            <div className="border border-dashed border-border/80 bg-background p-4">
              <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                What cannot change here
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Your email is locked because it comes from your sign-in
                provider. If that address changes, update it in{" "}
                <span translate="no">Google</span> first.
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
                    <FieldDescription>
                      Use the name you want to see in the app interface.
                    </FieldDescription>
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
                      placeholder="your-handle…"
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

                        const result =
                          await checkUsernameAvailability(normalized);
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
                      Short, readable, and easy to reuse later.
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
                  Read-only because your sign-in provider controls this field.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {politeStatusText}
          </p>
          <Button disabled={isSaveDisabled} type="submit">
            {updateProfileMutation.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : null}
            Save Profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
