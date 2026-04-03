import { ArrowLeftIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getAuthSession(await headers());

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col w-full gap-4 p-6">
      <div className="gap-2 flex-1">
        <Button
          className="mb-6 flex-1 gap-1 items-center"
          size={"xs"}
          variant={"outline"}
          asChild
        >
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            Go Back
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-medium">Settings</h1>
        <p className="text-muted-foreground text-md">
          Manage your account and preferences.
        </p>
      </div>
    </div>
  );
}
