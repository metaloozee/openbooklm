"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";

export const GoogleSignInButton = () => {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      await authClient.signIn.social({
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
      type="button"
      className="cursor-pointer"
    >
      {pending ? <Spinner /> : "Continue with Google"}
    </Button>
  );
};
