"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

export const SignOutButton = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      await authClient.signOut();
      router.refresh();
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
      variant="outline"
    >
      Sign out
    </Button>
  );
};
