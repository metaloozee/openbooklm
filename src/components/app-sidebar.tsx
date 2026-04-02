"use client";

import { ChevronRightIcon, FilesIcon, MessageSquareIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { NavProjectDocuments } from "@/components/nav-project-documents";
import { ProjectSwitcher } from "@/components/project-switcher";
import { SidebarUserMenu } from "@/components/sidebar-user-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const sections = [
  {
    emptyDescription: "Start a chat to see it here.",
    emptyTitle: "No Chats Yet",
    icon: MessageSquareIcon,
    title: "Chats",
  },
] as const;

const SidebarCollections = ({ projectSlug }: { projectSlug: string }) => (
  <SidebarGroup>
    <SidebarMenu>
      <Collapsible asChild className="group/collapsible" defaultOpen>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip="Documents">
              <FilesIcon aria-hidden="true" />
              <span>Documents</span>
              <ChevronRightIcon
                aria-hidden="true"
                className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <NavProjectDocuments projectSlug={projectSlug} />
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>

      {sections.map((section) => {
        const Icon = section.icon;

        return (
          <Collapsible
            key={section.title}
            asChild
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={section.title}>
                  <Icon aria-hidden="true" />
                  <span>{section.title}</span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <Empty className="min-h-0 items-start justify-start gap-1 px-2 py-2 text-left">
                      <EmptyHeader className="max-w-none items-start gap-1 text-left">
                        <EmptyTitle className="text-xs font-medium">
                          {section.emptyTitle}
                        </EmptyTitle>
                        <EmptyDescription className="text-xs leading-relaxed">
                          {section.emptyDescription}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </SidebarMenu>
  </SidebarGroup>
);

export const AppSidebar = ({
  project,
  ...props
}: ComponentProps<typeof Sidebar> & {
  project: {
    name: string;
    slug: string;
  };
}) => (
  <Sidebar collapsible="icon" {...props}>
    <SidebarHeader>
      <ProjectSwitcher currentProject={project} />
    </SidebarHeader>

    <SidebarContent>
      <SidebarCollections projectSlug={project.slug} />
    </SidebarContent>

    <SidebarFooter>
      <SidebarUserMenu />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
);
