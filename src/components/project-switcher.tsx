"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTRPC } from "@/lib/trpc/client";

export interface ProjectSwitcherProject {
  name: string;
  slug: string;
}

export const ProjectSwitcher = ({
  currentProject,
}: {
  currentProject: ProjectSwitcherProject;
}) => {
  const trpc = useTRPC();
  const { isMobile } = useSidebar();

  const projectListQueryOptions = useMemo(
    () => trpc.project.listProjects.queryOptions({ includeArchived: false }),
    [trpc]
  );

  const projectListQuery = useQuery({
    ...projectListQueryOptions,
    retry: false,
  });

  const otherProjects =
    projectListQuery.data?.filter(
      (project) => project.slug !== currentProject.slug
    ) ?? [];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`Switch project. Current project ${currentProject.name}`}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 items-center justify-center border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
                <BookOpenIcon aria-hidden="true" className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-[10px] font-medium tracking-[0.22em] text-sidebar-foreground/60 uppercase">
                  Project
                </span>
                <span className="truncate font-medium">
                  {currentProject.name}
                </span>
              </div>
              <ChevronDownIcon
                aria-hidden="true"
                className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-xs tracking-[0.18em] uppercase">
              Switch project
            </DropdownMenuLabel>
            <DropdownMenuItem disabled>
              <BookOpenIcon aria-hidden="true" />
              <span className="truncate">{currentProject.name}</span>
            </DropdownMenuItem>
            {projectListQuery.isPending ? (
              <DropdownMenuItem disabled>Loading projects…</DropdownMenuItem>
            ) : null}
            {projectListQuery.isError ? (
              <DropdownMenuItem disabled>
                Unable to load projects
              </DropdownMenuItem>
            ) : null}
            {!projectListQuery.isPending &&
            !projectListQuery.isError &&
            otherProjects.length === 0 ? (
              <DropdownMenuItem disabled>No other projects</DropdownMenuItem>
            ) : null}
            {!projectListQuery.isPending &&
            !projectListQuery.isError &&
            otherProjects.length > 0
              ? otherProjects.map((project) => (
                  <DropdownMenuItem key={project.id} asChild>
                    <Link href={`/projects/${project.slug}`}>
                      <BookOpenIcon aria-hidden="true" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))
              : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
