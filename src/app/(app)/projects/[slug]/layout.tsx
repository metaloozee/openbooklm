import { ProjectWorkspaceShell } from "@/components/projects/project-workspace-shell";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[slug]">) {
  const { slug } = await params;

  return <ProjectWorkspaceShell slug={slug}>{children}</ProjectWorkspaceShell>;
}
