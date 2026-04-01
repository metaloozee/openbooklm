import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { initAuth } from "@/lib/auth";
import { caller } from "@/lib/trpc/server";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const auth = await initAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;
  try {
    await caller.project.getProjectBySlug({ slug });
  } catch {
    return notFound();
  }

  return (
    <div className="flex w-full flex-1 flex-col p-6">
      <section className="flex flex-1 flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        <h1 className="font-heading text-lg font-medium">
          Chat Workspace Soon
        </h1>
        <p className="max-w-sm text-xs text-muted-foreground">
          Use the top bar to update project settings or prepare document
          uploads.
        </p>
      </section>
    </div>
  );
}
