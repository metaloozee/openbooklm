import "server-only";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { caller } from "@/lib/trpc/server";

export const ProjectWorkspaceShell = async ({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  let projectRecord;
  try {
    projectRecord = await caller.project.getProjectBySlug({ slug });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const projectSummary = {
    description: projectRecord.description,
    id: projectRecord.id,
    name: projectRecord.name,
    slug: projectRecord.slug,
  };

  return (
    <SidebarProvider>
      <AppSidebar project={projectSummary} />
      <SidebarInset className="flex flex-col">
        <AppHeader project={projectSummary} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};
