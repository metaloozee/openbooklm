"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserMenuContent,
  useUserMenuSession,
} from "@/components/user-menu-content";

export const UserAvatarMenu = () => {
  const { handleSignOut, isPending, isSigningOut, user } = useUserMenuSession();

  if (isPending) {
    return <Skeleton className="size-10 rounded-full" />;
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-10 rounded-none"
          aria-label={`Open user menu for ${user.displayName}`}
        >
          <Avatar className="size-9 rounded-none">
            <AvatarImage
              alt={user.displayName}
              src={user.image}
              className="rounded-none"
            />
            <AvatarFallback className="rounded-none">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <UserMenuContent
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
