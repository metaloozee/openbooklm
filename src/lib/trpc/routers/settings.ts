import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { user, userSettings } from "@/lib/db/schema";
import {
  DEFAULT_AI_SETTINGS,
  MAX_PROFILE_CONTEXT_LENGTH,
  MAX_USERNAME_LENGTH,
  getUsernameValidationMessage,
  isResponseStyle,
  normalizeUsernameInput,
  RESPONSE_STYLE_VALUES,
} from "@/lib/settings";

import { createTRPCRouter, protectedProcedure } from "../init";

const MAX_NAME_LENGTH = 120;

const toNullableUsername = (value: string | null | undefined) => {
  const normalized = normalizeUsernameInput(value ?? "");

  return normalized.length > 0 ? normalized : null;
};

const assertValidUsername = (value: string) => {
  const validationMessage = getUsernameValidationMessage(value);

  if (validationMessage) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: validationMessage,
    });
  }
};

export const settingsRouter = createTRPCRouter({
  checkUsernameAvailability: protectedProcedure
    .input(
      z.object({
        username: z.string().trim().min(1).max(MAX_USERNAME_LENGTH),
      })
    )
    .query(async ({ ctx, input }) => {
      const normalized = normalizeUsernameInput(input.username);
      assertValidUsername(normalized);

      const existingUser = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(
          and(eq(user.username, normalized), ne(user.id, ctx.session.user.id))
        )
        .limit(1);

      return {
        available: existingUser.length === 0,
        message:
          existingUser.length === 0
            ? "Username is available."
            : "That username is already taken.",
        normalized,
      };
    }),

  getMySettings: protectedProcedure.query(async ({ ctx }) => {
    const [settingsRecord] = await ctx.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.session.user.id))
      .limit(1);

    return {
      account: {
        createdAt: ctx.session.user.createdAt,
        email: ctx.session.user.email,
        emailVerified: ctx.session.user.emailVerified,
        image: ctx.session.user.image ?? null,
        name: ctx.session.user.name,
        providerLabel: "Google",
        updatedAt: settingsRecord?.updatedAt ?? ctx.session.user.updatedAt,
        username: ctx.session.user.username ?? null,
      },
      ai: {
        citeSourcesByDefault:
          settingsRecord?.citeSourcesByDefault ??
          DEFAULT_AI_SETTINGS.citeSourcesByDefault,
        profileContext:
          settingsRecord?.profileContext ?? DEFAULT_AI_SETTINGS.profileContext,
        responseStyle: isResponseStyle(settingsRecord?.responseStyle ?? "")
          ? (settingsRecord.responseStyle as (typeof RESPONSE_STYLE_VALUES)[number])
          : DEFAULT_AI_SETTINGS.responseStyle,
      },
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
        username: z.string().trim().max(MAX_USERNAME_LENGTH).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const nextUsername = toNullableUsername(input.username);

      if (nextUsername) {
        assertValidUsername(nextUsername);

        const existingUser = await ctx.db
          .select({ id: user.id })
          .from(user)
          .where(
            and(
              eq(user.username, nextUsername),
              ne(user.id, ctx.session.user.id)
            )
          )
          .limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That username is already taken.",
          });
        }
      }

      try {
        const [updatedUser] = await ctx.db
          .update(user)
          .set({
            name: input.name.trim(),
            username: nextUsername,
          })
          .where(eq(user.id, ctx.session.user.id))
          .returning({
            id: user.id,
            image: user.image,
            name: user.name,
            updatedAt: user.updatedAt,
            username: user.username,
          });

        if (!updatedUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found.",
          });
        }

        return updatedUser;
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "23505"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That username is already taken.",
          });
        }

        throw error;
      }
    }),

  upsertMyAiSettings: protectedProcedure
    .input(
      z.object({
        citeSourcesByDefault: z.boolean(),
        profileContext: z
          .string()
          .trim()
          .max(MAX_PROFILE_CONTEXT_LENGTH)
          .nullable(),
        responseStyle: z.enum(RESPONSE_STYLE_VALUES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const nextProfileContext = input.profileContext?.trim() || null;

      const [savedSettings] = await ctx.db
        .insert(userSettings)
        .values({
          citeSourcesByDefault: input.citeSourcesByDefault,
          profileContext: nextProfileContext,
          responseStyle: input.responseStyle,
          userId: ctx.session.user.id,
        })
        .onConflictDoUpdate({
          set: {
            citeSourcesByDefault: input.citeSourcesByDefault,
            profileContext: nextProfileContext,
            responseStyle: input.responseStyle,
            updatedAt: new Date(),
          },
          target: userSettings.userId,
        })
        .returning();

      if (!savedSettings) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to save AI personalization settings.",
        });
      }

      return savedSettings;
    }),
});
