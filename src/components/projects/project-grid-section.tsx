"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanbanIcon,
  MoveRightIcon,
  RefreshCcwIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const GuidanceCard = () => (
  <Card className="border border-dashed border-border/80 bg-background">
    <CardHeader className="gap-3 border-b border-dashed border-border/80 pb-5">
      <Badge variant="outline" className="tracking-[0.18em] uppercase">
        Workflow
      </Badge>
      <div className="space-y-1">
        <h2 className="font-heading text-base font-medium">
          What Happens Next
        </h2>
        <CardDescription className="text-sm text-muted-foreground">
          A project is where documents, questions, and grounded answers will
          eventually stay together.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 pt-5">
      <div className="rounded-none border border-dashed border-border/80 bg-muted/20 p-4">
        <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Recommended flow
        </p>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
          <li>1. Create a project for the topic you want to keep separate.</li>
          <li>2. Upload the source documents that matter for that project.</li>
          <li>
            3. Return when you want grounded answers tied back to those files.
          </li>
        </ol>
      </div>

      <div className="flex gap-3 text-sm text-muted-foreground">
        <SparklesIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <p>
          Keep project names plain and specific so they are easy to scan later.
        </p>
      </div>
    </CardContent>
  </Card>
);

export const ProjectGridSection = ({
  displayName,
}: {
  displayName: string;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const projectsQueryOptions = useMemo(
    () =>
      trpc.project.listProjects.queryOptions({
        includeArchived: false,
      }),
    [trpc]
  );

  const projectsQuery = useQuery(projectsQueryOptions);
  const projectCount = projectsQuery.data?.length ?? 0;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-border pb-6">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tracking-[0.18em] uppercase">
                Workspace
              </Badge>
              <Badge variant="ghost">{projectCount} active projects</Badge>
            </div>

            <div className="space-y-1">
              <h2 className="max-w-3xl text-balance font-heading text-3xl font-medium tracking-tight">
                Welcome back,{" "}
                <span className="text-muted-foreground">{displayName}</span>.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Continue a project you already know, or start a fresh workspace
                for a new batch of documents.
              </p>
            </div>
          </div>

          <NewProjectDialog
            onProjectCreated={async () => {
              await queryClient.invalidateQueries({
                queryKey: projectsQueryOptions.queryKey,
              });
            }}
          />
        </div>

        {projectsQuery.isPending ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="border border-dashed border-border/80 bg-background"
              >
                <CardHeader className="gap-3 border-b border-dashed border-border/80 pb-5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-3 pt-5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {projectsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to Load Projects</AlertTitle>
            <AlertDescription>
              Refresh to try again. If the issue continues, check the server
              logs.
            </AlertDescription>
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void projectsQuery.refetch();
                }}
              >
                <RefreshCcwIcon aria-hidden="true" />
                Refresh
              </Button>
            </div>
          </Alert>
        ) : null}

        {!projectsQuery.isPending &&
        !projectsQuery.isError &&
        projectCount === 0 ? (
          <Empty className="min-h-80 border border-dashed border-border bg-background">
            <EmptyHeader className="max-w-xl gap-4">
              <EmptyMedia variant="icon">
                <FolderKanbanIcon aria-hidden="true" />
              </EmptyMedia>
              <div className="space-y-2">
                <EmptyTitle>Start With Your First Project</EmptyTitle>
                <EmptyDescription>
                  Think of a project as the home for one topic, one client, or
                  one research thread. Add documents there first so the app has
                  something grounded to work from later.
                </EmptyDescription>
              </div>
            </EmptyHeader>
          </Empty>
        ) : null}

        {!projectsQuery.isPending &&
        !projectsQuery.isError &&
        projectCount > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projectsQuery.data.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.slug}`}
                className="block focus-visible:outline-none"
                aria-label={`Open project ${item.name}`}
              >
                <Card className="h-full border border-dashed border-border/80 bg-background transition-colors hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/50">
                  <CardHeader className="gap-4 border-b border-dashed border-border/80 pb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                          Project
                        </p>
                        <h3 className="truncate font-heading text-xl font-medium text-foreground">
                          {item.name}
                        </h3>
                      </div>
                      <p
                        className="max-w-[9rem] truncate text-right text-xs text-muted-foreground"
                        translate="no"
                      >
                        /{item.slug}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <p className="line-clamp-3 min-h-[4.5rem] break-words text-sm leading-6 text-muted-foreground">
                      {item.description?.trim() ||
                        "No description yet. Add one when the project needs more context."}
                    </p>
                    <div className="flex items-center justify-between gap-4 border-t border-dashed border-border/80 pt-4">
                      <p className="text-[11px] text-muted-foreground [font-variant-numeric:tabular-nums]">
                        Updated {dateFormatter.format(new Date(item.updatedAt))}
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        Open
                        <MoveRightIcon aria-hidden="true" className="size-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <GuidanceCard />
      </div>
    </section>
  );
};
