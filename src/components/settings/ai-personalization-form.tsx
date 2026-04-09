"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ResponseStyle } from "@/lib/settings";
import { useTRPC } from "@/lib/trpc/client";

const getFieldError = (errors: unknown[]): string | null => {
  for (const error of errors) {
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
  }

  return null;
};

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

  const saveAiSettingsMutation = useMutation(
    trpc.settings.upsertMyAiSettings.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Unable to save AI personalization");
      },
      onSuccess: () => {
        router.refresh();
        toast.success("AI personalization updated");
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
    },
  });

  const politeStatusText = useMemo(() => {
    if (saveAiSettingsMutation.isPending) {
      return "Saving AI personalization...";
    }

    if (saveAiSettingsMutation.isSuccess) {
      return "AI personalization saved.";
    }

    if (saveAiSettingsMutation.isError) {
      return "AI personalization save failed.";
    }

    return "";
  }, [
    saveAiSettingsMutation.isError,
    saveAiSettingsMutation.isPending,
    saveAiSettingsMutation.isSuccess,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI personalization</CardTitle>
        <CardDescription>
          Shape how the app answers grounded questions about your documents.
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
          <FieldGroup>
            <form.Field
              name="profileContext"
              validators={{
                onBlur: ({ value }) => {
                  if (value.trim().length > 2000) {
                    return "Keep your context under 2000 characters.";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>About you</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      placeholder="e.g. I prefer concise answers with bullet points and explicit next steps."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                    />
                    <FieldDescription>
                      Saved as reusable context for future document Q&amp;A.
                    </FieldDescription>
                    <FieldError>
                      {getFieldError(field.state.meta.errors)}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="responseStyle">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Response style</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value as ResponseStyle);
                      }}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Choose a response style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Controls the default depth of grounded answers.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="citeSourcesByDefault">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Source citations</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value as "true" | "false");
                      }}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Choose a citation preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">
                          Always cite sources
                        </SelectItem>
                        <SelectItem value="false">Only when helpful</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Keeps answers grounded in your uploaded document context.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {politeStatusText}
          </p>
          <Button disabled={saveAiSettingsMutation.isPending} type="submit">
            {saveAiSettingsMutation.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : null}
            Save AI personalization
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
