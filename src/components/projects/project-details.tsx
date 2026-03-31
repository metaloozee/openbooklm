import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caller } from "@/lib/trpc/server";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const ProjectDetails = async ({ slug }: { slug: string }) => {
  try {
    const project = await caller.project.getProjectBySlug({ slug });

    return (
      <div className="flex w-full flex-1 flex-col gap-4 p-6">
        <Card className="gap-3">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="truncate pr-2">{project.name}</CardTitle>
              <Badge variant="outline">Project</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground">Slug</p>
              <p className="break-words font-medium">{project.slug}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">Description</p>
              <p className="break-words font-medium">
                {project.description?.trim() || "No description added."}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium [font-variant-numeric:tabular-nums]">
                {dateFormatter.format(new Date(project.createdAt))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch {
    return notFound();
  }
};
