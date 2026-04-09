import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountSummaryCard } from "@/components/settings/account-summary-card";
import { AiPersonalizationForm } from "@/components/settings/ai-personalization-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { SettingsOverviewCard } from "@/components/settings/settings-overview-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { caller } from "@/lib/trpc/server";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const settings = await caller.settings.getMySettings();
  const displayName = settings.account.name.trim() || settings.account.email;
  const username = settings.account.username?.trim();

  return (
    <main className="flex w-full flex-1 flex-col gap-8 p-6 lg:gap-10 lg:p-8">
      <section className="grid gap-6 border-b border-dashed border-border pb-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-end">
        <div className="space-y-5">
          <Button size="xs" variant="outline" asChild>
            <Link href="/">
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tracking-[0.18em] uppercase">
                Account Settings
              </Badge>
              <Badge variant="ghost">Minimal &amp; Clear</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="max-w-4xl text-balance font-heading text-4xl font-medium tracking-tight sm:text-5xl">
                Keep Your Account Easy to Recognize & Your Answers Easy to Read.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Update the identity details you see every day, then choose the
                default tone and citation habits you want when the app is
                answering questions from your documents.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-dashed border-border/80 bg-muted/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                Current Account Snapshot
              </p>
              <p className="truncate text-lg font-medium text-foreground">
                {displayName}
              </p>
              <p
                className="truncate text-sm text-muted-foreground"
                translate="no"
              >
                {settings.account.email}
              </p>
              {username ? (
                <p className="text-xs text-muted-foreground" translate="no">
                  @{username}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No username set yet.
                </p>
              )}
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center border border-border bg-background text-primary">
              <BookOpenIcon aria-hidden="true" className="size-5" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
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
          <SettingsOverviewCard />
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
