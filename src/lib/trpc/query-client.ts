import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { deserialize } from "superjson";

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: deserialize,
      },
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });
