"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  SidebarGroupContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTRPC } from "@/lib/trpc/client";

export const NavProjects = () => {
  const trpc = useTRPC();
  const pathname = usePathname();

  const projectsQueryOptions = useMemo(
    () =>
      trpc.project.listProjects.queryOptions({
        includeArchived: false,
      }),
    [trpc]
  );

  const projectsQuery = useQuery(projectsQueryOptions);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projectsQuery.isPending ? (
            <SidebarMenuItem>
              <SidebarMenuButton disabled tooltip="Loading projects">
                <FolderIcon aria-hidden="true" />
                <span>Loading…</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}

          {projectsQuery.isError ? (
            <SidebarMenuItem>
              <SidebarMenuButton disabled tooltip="Unable to load projects">
                <FolderIcon aria-hidden="true" />
                <span>Unable to load</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}

          {!projectsQuery.isPending &&
          !projectsQuery.isError &&
          (projectsQuery.data?.length ?? 0) === 0 ? (
            <SidebarMenuItem>
              <Empty className="min-h-0 items-start justify-start gap-1 border border-dashed border-sidebar-border px-2 py-2 text-left">
                <EmptyHeader className="max-w-none items-start gap-1 text-left">
                  <EmptyTitle className="text-xs font-medium">
                    No Projects Yet
                  </EmptyTitle>
                  <EmptyDescription className="text-xs leading-relaxed">
                    Create one from the home page.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </SidebarMenuItem>
          ) : null}

          {!projectsQuery.isPending &&
          !projectsQuery.isError &&
          (projectsQuery.data?.length ?? 0) > 0
            ? projectsQuery.data.map((item) => {
                const href = `/projects/${item.slug}`;
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link href={href}>
                        <FolderIcon aria-hidden="true" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })
            : null}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
