import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProjectDetails } from "@/components/projects/project-details";
import { initAuth } from "@/lib/auth";

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

  return <ProjectDetails slug={slug} />;
}
