"use client";

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
import { usePathname } from "next/navigation";
import { Fragment } from "react";

function formatSegment(segment: string): string {
	return segment
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export function AppTopbar() {
	const pathname = usePathname();

	const segments = pathname.split("/").filter(Boolean);

	return (
		<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[variant=inset]/sidebar-wrapper:min-h-[calc(3rem+1px)]">
			<div className="flex items-center gap-2">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 data-vertical:h-4" />
				<Breadcrumb>
					<BreadcrumbList>
						{segments.map((segment, index) => {
							const href = `/${segments.slice(0, index + 1).join("/")}`;
							const isLast = index === segments.length - 1;

							return (
								<Fragment key={href}>
									{index > 0 && <BreadcrumbSeparator />}
									<BreadcrumbItem>
										{isLast ? (
											<BreadcrumbPage>
												{formatSegment(segment)}
											</BreadcrumbPage>
										) : (
											<BreadcrumbLink href={href}>
												{formatSegment(segment)}
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
								</Fragment>
							);
						})}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
		</header>
	);
}
