"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanbanIcon, RefreshCcwIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-medium text-balance">
            Welcome back,{" "}
            <span className="text-muted-foreground">{displayName}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Pick up where you left off, or start a new project.
          </p>
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="gap-3">
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {projectsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to Load Projects</AlertTitle>
          <AlertDescription>
            Refresh to try again. If the issue continues, check the server logs.
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
      (projectsQuery.data?.length ?? 0) === 0 ? (
        <Empty className="min-h-56 border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanbanIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No Projects Yet</EmptyTitle>
            <EmptyDescription>
              Create your first project to organize documents, chats, and notes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!projectsQuery.isPending &&
      !projectsQuery.isError &&
      (projectsQuery.data?.length ?? 0) > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data.map((item) => (
            <Link
              key={item.id}
              href={`/projects/${item.slug}`}
              className="block focus-visible:outline-none"
              aria-label={`Open project ${item.name}`}
            >
              <Card className="gap-3 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate pr-2">{item.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      /{item.slug}
                    </p>
                  </div>
                  <CardDescription className="truncate"></CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="line-clamp-2 min-h-8 break-words text-muted-foreground">
                    {item.description?.trim() || "No description added."}
                  </p>
                  <p className="text-[11px] text-muted-foreground [font-variant-numeric:tabular-nums]">
                    Updated {dateFormatter.format(new Date(item.updatedAt))}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
};
