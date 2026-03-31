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
      session: {
        ...session,
        user: session.user,
      },
    };
  }

  return {
    db,
    session: null,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  });

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx,
  });
});

export const createTRPCRouter = t.router;
// oxlint-disable-next-line prefer-destructuring
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
