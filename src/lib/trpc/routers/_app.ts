import { publicProcedure, createTRPCRouter, protectedProcedure } from "../init";

export const appRouter = createTRPCRouter({
  sayHello: publicProcedure.query(() => ({
    greeting: "Hello, World!",
  })),
  sayHelloButProtected: protectedProcedure.query(({ ctx }) => ({
    greeting: `Welcome back, ${ctx.session.user.name}`,
  })),
});

export type AppRouter = typeof appRouter;
