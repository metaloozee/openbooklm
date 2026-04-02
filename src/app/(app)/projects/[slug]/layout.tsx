import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { initAuth } from "@/lib/auth";
import { caller } from "@/lib/trpc/server";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[slug]">) {
  const auth = await initAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  try {
    const project = await caller.project.getProjectBySlug({ slug });
    const projectSummary = {
      description: project.description,
      id: project.id,
      name: project.name,
      slug: project.slug,
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
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      return notFound();
    }

    throw error;
  }
}
