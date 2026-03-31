"use client";

import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
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

export const SidebarUserMenu = () => {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton className="h-12" showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!data?.user) {
    return null;
  }

  const { user } = data;
  const displayName = user.name?.trim() || user.email;
  const { email } = user;
  const initials = getInitials(displayName, email);
  const image = user.image ?? "";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.refresh();
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-none">
                <AvatarImage
                  alt={displayName}
                  src={image}
                  className="rounded-none"
                />
                <AvatarFallback className="rounded-none">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <SettingsIcon />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signingOut}
              onClick={() => {
                void handleSignOut();
              }}
              variant="destructive"
            >
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
