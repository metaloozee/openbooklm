import { publicProcedure, createTRPCRouter, protectedProcedure } from "../init";
import { projectRouter } from "./project";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  sayHello: publicProcedure.query(() => ({
    greeting: "Hello, World!",
  })),
  sayHelloButProtected: protectedProcedure.query(({ ctx }) => ({
    greeting: `Welcome back, ${ctx.session.user.name}`,
  })),
});

export type AppRouter = typeof appRouter;
