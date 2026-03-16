import { SidebarInset, SidebarProvider } from "@openbooklm/ui/components/sidebar";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />
			<SidebarInset>
				<AppTopbar />
				<div className="flex flex-1 flex-col">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
