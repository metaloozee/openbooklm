"use client";

import { Button } from "@openbooklm/ui/components/button";
import { BookOpenIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center px-6">
			<div className="mx-auto max-w-lg text-center">
				<div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
					<BookOpenIcon className="size-7" />
				</div>
				<h1 className="text-2xl font-bold tracking-tight">OpenBookLM</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					An open-source, model-agnostic AI research environment. Upload sources, get
					grounded answers, and generate rich artifacts — all through conversation.
				</p>
				<div className="mt-6 flex items-center justify-center gap-3">
					<Button asChild>
						<Link href="/dashboard">Get Started</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/login">Sign In</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
