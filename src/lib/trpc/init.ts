import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { getAuthSession } from "../auth";
import { getDbAsync } from "../db";

export interface Context {
  headers: Headers;
}

export const createTRPCContext = (opts: { headers: Headers }): Context => ({
  headers: opts.headers,
});

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  const db = await getDbAsync();
  const session = await getAuthSession(ctx.headers);

  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      db,
      session: {
        ...session,
        user: session.user,
      },
    },
  });
});

export const createTRPCRouter = t.router;
// oxlint-disable-next-line prefer-destructuring
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
