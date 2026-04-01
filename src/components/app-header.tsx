"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  UploadIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo, useState } from "react";

import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";
import { ProjectUploadDocumentsDialog } from "@/components/projects/project-upload-documents-dialog";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTRPC } from "@/lib/trpc/client";

const APP_NAME = "Home";

const humanizeSegment = (segment: string): string =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const AppHeader = () => {
  const trpc = useTRPC();
  const pathname = usePathname();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
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

  const mobileLabel = (() => {
    if (segments.length === 0) {
      return APP_NAME;
    }

    if (isProjectDetailRoute) {
      return (
        projectQuery.data?.name ?? humanizeSegment(projectSlug ?? "project")
      );
    }

    const lastSegment = decodeURIComponent(segments.at(-1) ?? "");

    if (segments[0] === "projects" && segments.length === 1) {
      return "Projects";
    }

    return humanizeSegment(lastSegment);
  })();

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
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:gap-4 sm:px-4">
      <SidebarTrigger />
      <Separator
        className="my-auto hidden size-4 sm:block"
        orientation="vertical"
      />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="hidden sm:flex">
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

        <BreadcrumbList className="sm:hidden">
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{mobileLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isProjectDetailRoute && projectSlug ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="sm:hidden"
                aria-label="Open project actions"
              >
                <SlidersHorizontalIcon aria-hidden="true" />
                Manage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 sm:hidden">
              <DropdownMenuItem
                disabled={projectQuery.isPending}
                onSelect={() => {
                  setIsUploadDialogOpen(true);
                }}
              >
                <UploadIcon aria-hidden="true" />
                Upload Documents
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={projectQuery.isPending || projectQuery.isError}
                onSelect={() => {
                  setIsSettingsDialogOpen(true);
                }}
              >
                <Settings2Icon aria-hidden="true" />
                Project Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ProjectUploadDocumentsDialog
            disabled={projectQuery.isPending}
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
            triggerClassName="hidden sm:inline-flex"
          />
          <ProjectSettingsDialog
            project={projectQuery.data}
            projectSlug={projectSlug}
            disabled={projectQuery.isPending || projectQuery.isError}
            open={isSettingsDialogOpen}
            onOpenChange={setIsSettingsDialogOpen}
            triggerClassName="hidden sm:inline-flex"
          />
        </div>
      ) : null}
    </header>
  );
};
