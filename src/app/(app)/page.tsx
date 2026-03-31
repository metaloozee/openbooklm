import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProjectGridSection } from "@/components/projects/project-grid-section";
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
    <div className="flex w-full flex-1 flex-col gap-4 p-6">
      <ProjectGridSection displayName={displayName} />
    </div>
  );
}
