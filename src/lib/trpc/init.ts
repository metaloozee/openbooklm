import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { initAuth } from "../auth";
import { getDbAsync } from "../db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const auth = await initAuth();
  const db = await getDbAsync();

  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  if (session && session.user) {
    return {
      db,
      session: { ...session, user: session.user },
    };
  }

  return {
    db,
    session: null,
  };
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  });

export const createTRPCRouter = t.router;
// oxlint-disable-next-line prefer-destructuring
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(function isAuthed(opts) {
  const { ctx, next } = opts;
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
