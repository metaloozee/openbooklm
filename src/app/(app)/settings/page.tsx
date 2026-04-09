import { ArrowLeftIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountSummaryCard } from "@/components/settings/account-summary-card";
import { AiPersonalizationForm } from "@/components/settings/ai-personalization-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { Button } from "@/components/ui/button";
import { UserAvatarMenu } from "@/components/user-avatar-menu";
import { auth } from "@/lib/auth";
import { caller } from "@/lib/trpc/server";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const settings = await caller.settings.getMySettings();

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <section className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed pb-6">
        <div className="space-y-3">
          <Button size="xs" variant="outline" asChild>
            <Link href="/">
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              Back to dashboard
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-medium">Settings</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage your account details and tailor how grounded answers should
              feel once document Q&amp;A is in play.
            </p>
          </div>
        </div>
        <UserAvatarMenu />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <ProfileSettingsForm
            email={settings.account.email}
            image={settings.account.image ?? ""}
            name={settings.account.name}
            username={settings.account.username ?? ""}
          />
          <AiPersonalizationForm
            initialCiteSourcesByDefault={settings.ai.citeSourcesByDefault}
            initialProfileContext={settings.ai.profileContext}
            initialResponseStyle={settings.ai.responseStyle}
          />
        </div>

        <div className="space-y-6">
          <AccountSummaryCard
            createdAt={settings.account.createdAt.toISOString()}
            emailVerified={settings.account.emailVerified}
            providerLabel={settings.account.providerLabel}
            updatedAt={settings.account.updatedAt.toISOString()}
          />
        </div>
      </div>
    </div>
  );
}
