import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initAuth } from "@/lib/auth";

export default async function HomePage() {
  const auth = await initAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const displayName = session.user.name?.trim() || session.user.email;
  const fallbackLabel = (displayName[0] || session.user.email[0] || "U")
    .toUpperCase()
    .slice(0, 1);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-4 py-16 text-foreground">
      <main className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <Avatar size="lg">
          <AvatarImage
            alt={`${displayName} avatar`}
            src={session.user.image || ""}
          />
          <AvatarFallback>{fallbackLabel}</AvatarFallback>
        </Avatar>
        <h1 className="font-heading text-lg font-medium">
          Welcome back {displayName}
        </h1>
        <SignOutButton />
      </main>
    </div>
  );
}
