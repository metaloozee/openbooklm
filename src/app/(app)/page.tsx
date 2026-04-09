import { BookOpenIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProjectGridSection } from "@/components/projects/project-grid-section";
import { Badge } from "@/components/ui/badge";
import { UserAvatarMenu } from "@/components/user-avatar-menu";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const displayName = session.user.name?.trim() || session.user.email;

  return (
    <main className="flex w-full flex-1 flex-col gap-8 p-6 lg:gap-10 lg:p-8">
      <section className="grid gap-6 border-b border-dashed border-border pb-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)] lg:items-end">
        <div className="space-y-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 items-center justify-center border border-border bg-primary text-primary-foreground">
              <BookOpenIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <p
                className="font-heading text-lg font-medium text-primary"
                translate="no"
              >
                OpenBookLM
              </p>
              <p className="text-xs text-muted-foreground">
                Grounded document workspaces
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tracking-[0.18em] uppercase">
                Dashboard
              </Badge>
              <Badge variant="ghost">Projects</Badge>
              <Badge variant="ghost">Documents</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="max-w-4xl text-balance font-heading text-4xl font-medium tracking-tight sm:text-5xl">
                A Calm Front Desk for the Documents You Want to Understand.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Create a project, upload material, and keep each research thread
                in one place before grounded answers come into view.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 border border-dashed border-border/80 bg-muted/20 p-5">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
              Signed in as
            </p>
            <p className="truncate text-lg font-medium text-foreground">
              {displayName}
            </p>
            <p
              className="truncate text-sm text-muted-foreground"
              translate="no"
            >
              {session.user.email}
            </p>
          </div>
          <UserAvatarMenu />
        </div>
      </section>

      <ProjectGridSection displayName={displayName} />
    </main>
  );
}
