import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  return (
    <div className="flex flex-1 flex-col w-full gap-4 p-6">
      <div className="gap-2 flex-1">
        <h1 className="font-heading text-2xl font-medium">
          Welcome back, {displayName}
        </h1>
      </div>
    </div>
  );
}
