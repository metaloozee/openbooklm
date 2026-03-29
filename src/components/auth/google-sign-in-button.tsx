"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

export const GoogleSignInButton = () => {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      await authClient.signIn.social({
        callbackURL: "/",
        provider: "google",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      aria-busy={pending}
      disabled={pending}
      onClick={handleClick}
      size="lg"
      type="button"
      variant="outline"
    >
      Continue with Google
    </Button>
  );
};
