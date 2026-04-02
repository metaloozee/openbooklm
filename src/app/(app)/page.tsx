import { BookOpenIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProjectGridSection } from "@/components/projects/project-grid-section";
import { UserAvatarMenu } from "@/components/user-avatar-menu";
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
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <section className="flex items-center justify-between border-b pb-6 border-dashed">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center border border-border bg-primary text-primary-foreground">
            <BookOpenIcon aria-hidden="true" className="size-5" />
          </div>
          <p className="font-bold text-primary">OpenBookLM</p>
        </div>
        <UserAvatarMenu />
      </section>
      <ProjectGridSection displayName={displayName} />
    </div>
  );
}
