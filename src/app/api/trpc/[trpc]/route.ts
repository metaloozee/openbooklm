import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { env } from "@/lib/env";
import { createTRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/lib/trpc/routers/_app";

const handler = (req: Request) =>
  fetchRequestHandler({
    createContext: () => createTRPCContext({ headers: req.headers }),
    endpoint: "/api/trpc",
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error("tRPC failed on", path ?? "<no-path>", error);
          }
        : undefined,
    req,
    router: appRouter,
  });

export { handler as GET, handler as POST };
