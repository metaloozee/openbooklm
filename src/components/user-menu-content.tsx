"use client";

import { LogOutIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/auth-client";

const getInitials = (name: string, email: string): string => {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const last = parts.at(-1);
    if (last?.[0] && parts[0]?.[0]) {
      return (parts[0][0] + last[0]).toUpperCase();
    }
  }

  return (source[0] || "U").toUpperCase();
};

export interface UserMenuSessionData {
  displayName: string;
  email: string;
  image: string;
  initials: string;
}

export const useUserMenuSession = (): {
  handleSignOut: () => Promise<void>;
  isPending: boolean;
  isSigningOut: boolean;
  user: UserMenuSessionData | null;
} => {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const sessionUser = data?.user;
  const displayName = sessionUser?.name?.trim() || sessionUser?.email || "";

  const user = sessionUser
    ? {
        displayName,
        email: sessionUser.email,
        image: sessionUser.image ?? "",
        initials: getInitials(displayName, sessionUser.email),
      }
    : null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.refresh();
      router.push("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    handleSignOut,
    isPending,
    isSigningOut,
    user,
  };
};

export const UserMenuContent = ({
  isSigningOut,
  onSignOut,
}: {
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
}) => (
  <>
    <DropdownMenuItem asChild>
      <Link href="/settings">
        <SettingsIcon aria-hidden="true" />
        Settings
      </Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      disabled={isSigningOut}
      onClick={() => {
        void onSignOut();
      }}
      variant="destructive"
    >
      <LogOutIcon aria-hidden="true" />
      Sign out
    </DropdownMenuItem>
  </>
);
