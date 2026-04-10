import { ArrowLeftIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AiPersonalizationForm } from "@/components/settings/ai-personalization-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <section className="space-y-3 border-b border-dashed border-border pb-5">
        <Button size="xs" variant="outline" asChild>
          <Link href="/">
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and AI personalization.
          </p>
        </div>
      </section>

      <Tabs
        defaultValue="profile"
        className="flex-col gap-6 lg:flex-row lg:items-start"
      >
        <TabsList className="w-full lg:w-52">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ai">AI Personalization</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="w-full">
          <ProfileSettingsForm
            email={settings.account.email}
            image={settings.account.image ?? ""}
            name={settings.account.name}
            username={settings.account.username ?? ""}
          />
        </TabsContent>

        <TabsContent value="ai" className="w-full">
          <AiPersonalizationForm
            initialCiteSourcesByDefault={settings.ai.citeSourcesByDefault}
            initialProfileContext={settings.ai.profileContext}
            initialResponseStyle={settings.ai.responseStyle}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
