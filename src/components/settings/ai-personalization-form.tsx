"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_PROFILE_CONTEXT_LENGTH,
  RESPONSE_STYLE_OPTIONS,
} from "@/lib/settings";
import type { ResponseStyle } from "@/lib/settings";
import { useTRPC } from "@/lib/trpc/client";

import { getFieldError, useWarnIfDirty } from "./form-utils";

export const AiPersonalizationForm = ({
  initialCiteSourcesByDefault,
  initialProfileContext,
  initialResponseStyle,
}: {
  initialCiteSourcesByDefault: boolean;
  initialProfileContext: string;
  initialResponseStyle: ResponseStyle;
}) => {
  const router = useRouter();
  const trpc = useTRPC();
  const [isDirty, setIsDirty] = useState(false);
  const [selectedResponseStyle, setSelectedResponseStyle] =
    useState<ResponseStyle>(initialResponseStyle);

  const saveAiSettingsMutation = useMutation(
    trpc.settings.upsertMyAiSettings.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Unable to save AI personalization.");
      },
      onSuccess: () => {
        router.refresh();
        toast.success("AI personalization updated.");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      citeSourcesByDefault: initialCiteSourcesByDefault ? "true" : "false",
      profileContext: initialProfileContext,
      responseStyle: initialResponseStyle,
    },
    onSubmit: async ({ value }) => {
      await saveAiSettingsMutation.mutateAsync({
        citeSourcesByDefault: value.citeSourcesByDefault === "true",
        profileContext: value.profileContext.trim(),
        responseStyle: value.responseStyle,
      });
      setIsDirty(false);
    },
  });

  useWarnIfDirty(isDirty);

  const isSaveDisabled = !isDirty || saveAiSettingsMutation.isPending;
  const responseStyleDescription =
    RESPONSE_STYLE_OPTIONS.find(
      (option) => option.value === selectedResponseStyle
    )?.description ?? "Choose how much detail you want by default.";

  const politeStatusText = (() => {
    if (saveAiSettingsMutation.isPending) {
      return "Saving AI personalization…";
    }

    if (saveAiSettingsMutation.isSuccess) {
      return "AI personalization saved.";
    }

    if (saveAiSettingsMutation.isError) {
      return "AI personalization save failed.";
    }

    return isDirty ? "You have unsaved AI preference changes." : "";
  })();

  return (
    <Card className="border border-dashed border-border/80 bg-background">
      <CardHeader className="gap-3 border-b border-dashed border-border/80 pb-5">
        <Badge variant="outline" className="tracking-[0.18em] uppercase">
          AI Preferences
        </Badge>
        <div className="space-y-1">
          <h2 className="font-heading text-base font-medium">
            How Grounded Answers Should Feel
          </h2>
          <CardDescription className="max-w-2xl text-sm text-muted-foreground">
            Set your default answer style once so you do not have to repeat it
            every time you ask about a document.
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
          <div className="rounded-none border border-dashed border-border/80 bg-muted/20 p-4">
            <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
              Plain-language promise
            </p>
            <p className="mt-2 text-sm text-foreground">
              These preferences shape the tone, depth, and citation habits of
              future answers — not the facts retrieved from your documents.
            </p>
          </div>

          <FieldGroup>
            <form.Field
              name="profileContext"
              validators={{
                onBlur: ({ value }) => {
                  if (value.trim().length > MAX_PROFILE_CONTEXT_LENGTH) {
                    return `Keep this under ${MAX_PROFILE_CONTEXT_LENGTH} characters.`;
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>About You</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      autoComplete="off"
                      placeholder="e.g. I prefer concise answers with bullet points and explicit next steps…"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        setIsDirty(true);
                        field.handleChange(event.target.value);
                      }}
                    />
                    <FieldDescription>
                      Mention your role, audience, or preferred framing if it
                      helps the app answer in a more useful way.
                    </FieldDescription>
                    <FieldError>
                      {getFieldError(field.state.meta.errors)}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <div className="grid gap-5 lg:grid-cols-2">
              <form.Field name="responseStyle">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Response Depth</FieldLabel>
                    <FieldContent>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(value) => {
                          setIsDirty(true);
                          setSelectedResponseStyle(value as ResponseStyle);
                          field.handleChange(value as ResponseStyle);
                        }}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Choose a response style" />
                        </SelectTrigger>
                        <SelectContent>
                          {RESPONSE_STYLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        {responseStyleDescription}
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="citeSourcesByDefault">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Source Citations
                    </FieldLabel>
                    <FieldContent>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(value) => {
                          setIsDirty(true);
                          field.handleChange(value as "true" | "false");
                        }}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Choose a citation preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            Always show sources
                          </SelectItem>
                          <SelectItem value="false">
                            Show sources when helpful
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Choose how often the app should surface supporting
                        references by default.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {politeStatusText}
          </p>
          <Button disabled={isSaveDisabled} type="submit">
            {saveAiSettingsMutation.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : null}
            Save AI Personalization
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
