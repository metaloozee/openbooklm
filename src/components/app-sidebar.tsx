"use client";

import {
  ChevronRightIcon,
  FileTextIcon,
  FilesIcon,
  MessageSquareIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

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
    emptyDescription: "Upload documents to see them here.",
    emptyTitle: "No Documents Uploaded",
    icon: FilesIcon,
    title: "Documents",
  },
  {
    emptyDescription: "Start a chat to see it here.",
    emptyTitle: "No Chats Yet",
    icon: MessageSquareIcon,
    title: "Chats",
  },
];

export const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => (
  <Sidebar collapsible="icon" {...props}>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex h-12 w-full items-center gap-2 overflow-hidden p-2 text-left text-xs group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
            <div className="flex aspect-square size-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
              <FileTextIcon aria-hidden="true" className="size-4" />
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">Document RAG</span>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
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
    </SidebarContent>

    <SidebarFooter>
      <SidebarUserMenu />
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
);
