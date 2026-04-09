import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { userAdditionalFields } from "./auth-shared";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: userAdditionalFields,
    }),
  ],
});
