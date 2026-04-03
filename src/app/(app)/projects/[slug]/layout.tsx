import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAuthSession } from "@/lib/auth";
import { getProjectBySlugForUser } from "@/lib/projects/get-project-by-slug-for-user";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[slug]">) {
  const session = await getAuthSession(await headers());

  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  const project = await getProjectBySlugForUser(session.user.id, slug);

  if (!project) {
    notFound();
  }

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
}
