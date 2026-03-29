// oxlint-disable require-await
import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth/auth";

export const { POST, GET } = toNextJsHandler({
  handler: async (request) => getAuth().handler(request),
});
