"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTRPC } from "@/lib/trpc/client";

const APP_NAME = "Document RAG";

const humanizeSegment = (segment: string): string =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const AppHeader = () => {
  const trpc = useTRPC();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isProjectDetailRoute =
    segments[0] === "projects" && Boolean(segments[1]);
  const projectSlug =
    isProjectDetailRoute && segments[1]
      ? decodeURIComponent(segments[1])
      : null;

  const projectQueryOptions = useMemo(
    () =>
      trpc.project.getProjectBySlug.queryOptions({
        slug: projectSlug ?? "placeholder",
      }),
    [projectSlug, trpc]
  );

  const projectQuery = useQuery({
    ...projectQueryOptions,
    enabled: Boolean(projectSlug),
    retry: false,
  });

  const projectListQueryOptions = useMemo(
    () => trpc.project.listProjects.queryOptions({ includeArchived: false }),
    [trpc]
  );

  const projectListQuery = useQuery({
    ...projectListQueryOptions,
    enabled: isProjectDetailRoute,
    retry: false,
  });

  const otherProjects =
    projectListQuery.data?.filter((item) => item.slug !== projectSlug) ?? [];

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
      <SidebarTrigger />
      <Separator className="size-4 my-auto" orientation="vertical" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {segments.length === 0 ? (
              <BreadcrumbPage>{APP_NAME}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href="/">{APP_NAME}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>

          {isProjectDetailRoute ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <BreadcrumbLink asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                      >
                        Projects
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      </button>
                    </BreadcrumbLink>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {otherProjects.length === 0 ? (
                      <DropdownMenuItem disabled>
                        <BreadcrumbEllipsis />
                        No other projects
                      </DropdownMenuItem>
                    ) : (
                      otherProjects.map((item) => (
                        <DropdownMenuItem key={item.id} asChild>
                          <Link href={`/projects/${item.slug}`}>
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {projectQuery.data?.name ??
                    humanizeSegment(projectSlug ?? "project")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join("/")}`;
              const isLast = index === segments.length - 1;
              const decodedSegment = decodeURIComponent(segment);
              let label = humanizeSegment(decodedSegment);

              if (index === 0 && decodedSegment === "projects") {
                label = "Projects";
              }

              if (index === 1 && segments[0] === "projects") {
                label =
                  projectQuery.data?.name ?? humanizeSegment(decodedSegment);
              }

              return (
                <Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};
