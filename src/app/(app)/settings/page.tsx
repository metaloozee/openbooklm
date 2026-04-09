import { ArrowLeftIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountSummaryCard } from "@/components/settings/account-summary-card";
import { AiPersonalizationForm } from "@/components/settings/ai-personalization-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { caller } from "@/lib/trpc/server";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const settings = await caller.settings.getMySettings();

  return (
    <main className="flex w-full flex-1 flex-col gap-6 p-6 lg:gap-8 lg:p-8">
      <section className="space-y-4 border-b border-dashed border-border pb-6">
        <Button size="xs" variant="outline" asChild>
          <Link href="/">
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="space-y-1">
          <h1 className="max-w-3xl text-balance font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Update the account details you see every day and choose your default
            answer style for grounded document responses.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
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

        <div>
          <AccountSummaryCard
            createdAt={settings.account.createdAt.toISOString()}
            emailVerified={settings.account.emailVerified}
            providerLabel={settings.account.providerLabel}
            updatedAt={settings.account.updatedAt.toISOString()}
          />
        </div>
      </div>
    </main>
  );
}
