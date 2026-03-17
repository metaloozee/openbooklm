"use client";

import { AnimatedThemeToggler } from "@openbooklm/ui/components/animated-theme-toggler";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@openbooklm/ui/components/breadcrumb";
import { Separator } from "@openbooklm/ui/components/separator";
import { SidebarTrigger } from "@openbooklm/ui/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import type { UrlObject } from "url";

import { trpc } from "@/utils/trpc";

const RESERVED_PROJECT_SEGMENTS = new Set(["new"]);

function formatSegment(segment: string): string {
	if (segment === "dashboard") {
		return "Dashboard";
	}

	if (segment === "new") {
		return "New";
	}

	return segment
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function getProjectIdFromPathname(pathname: string) {
	const match = pathname.match(/^\/dashboard\/projects\/([^/]+)/);
	const slug = match?.[1] ?? null;
	return slug && !RESERVED_PROJECT_SEGMENTS.has(slug) ? slug : null;
}

function getArtifactParamsFromPathname(pathname: string) {
	const match = pathname.match(/^\/dashboard\/projects\/([^/]+)\/artifacts\/([^/]+)/);
	if (!match) {
		return null;
	}

	const [, projectId, artifactId] = match;
	if (!projectId || !artifactId) {
		return null;
	}

	return { projectId, artifactId };
}

export function AppTopbar() {
	const pathname = usePathname();
	const currentProjectId = getProjectIdFromPathname(pathname);
	const artifactParams = getArtifactParamsFromPathname(pathname);
	const projectsQuery = useQuery(trpc.projects.list.queryOptions());
	const artifactQuery = useQuery({
		...trpc.artifacts.byId.queryOptions(artifactParams ?? { projectId: "", artifactId: "" }),
		enabled: Boolean(artifactParams),
	});
	const segments = pathname.split("/").filter(Boolean);

	return (
		<header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[variant=inset]/sidebar-wrapper:min-h-[calc(3rem+1px)]">
			<div className="flex items-center justify-center gap-2">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2" />
				<Breadcrumb>
					<BreadcrumbList>
						{segments.map((segment, index) => {
							const href = `/${segments.slice(0, index + 1).join("/")}`;
							const isLast = index === segments.length - 1;
							const label =
								index === 2 && currentProjectId && segment === currentProjectId
									? (projectsQuery.data?.find(
											(project) => project.id === currentProjectId,
										)?.name ?? formatSegment(segment))
									: index === 4 &&
										  artifactParams &&
										  segment === artifactParams.artifactId
										? (artifactQuery.data?.title ?? "Artifact")
										: formatSegment(segment);

							return (
								<Fragment key={href}>
									{index > 0 && <BreadcrumbSeparator />}
									<BreadcrumbItem>
										{isLast ? (
											<BreadcrumbPage>{label}</BreadcrumbPage>
										) : (
											<BreadcrumbLink asChild>
												<Link href={href as unknown as UrlObject}>
													{label}
												</Link>
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
								</Fragment>
							);
						})}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
			<AnimatedThemeToggler variant={"ghost"} />
		</header>
	);
}
