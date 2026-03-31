import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { initAuth } from "@/lib/auth";

export default async function SettingsPage() {
  const auth = await initAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="font-heading text-2xl font-medium">Settings</h1>
      <p className="text-muted-foreground text-sm">
        Manage your account and preferences.
      </p>
    </div>
  );
}
