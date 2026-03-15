"use client";

import { Badge } from "@openbooklm/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@openbooklm/ui/components/card";
import { cn } from "@openbooklm/ui/lib/utils";

export function FieldErrors({
	errors,
	className,
}: {
	errors: Array<{ message?: string } | undefined>;
	className?: string;
}) {
	if (errors.length === 0) {
		return null;
	}

	return (
		<div className={cn("space-y-1", className)}>
			{errors.map((error, index) => (
				<p
					key={`${error?.message ?? "error"}-${index}`}
					className="text-xs/relaxed text-destructive"
				>
					{error?.message}
				</p>
			))}
		</div>
	);
}

export function NativeSelect({
	className,
	...props
}: React.ComponentPropsWithoutRef<"select">) {
	return (
		<select
			className={cn(
				"h-7 w-full min-w-0 rounded-md border border-input bg-input/20 px-2 py-0.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xs/relaxed dark:bg-input/30",
				className,
			)}
			{...props}
		/>
	);
}

export function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<Card className="border-dashed">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			{action ? <CardContent>{action}</CardContent> : null}
		</Card>
	);
}

export function StatCard({
	label,
	value,
	description,
}: {
	label: string;
	value: string | number;
	description: string;
}) {
	return (
		<Card size="sm">
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl">{value}</CardTitle>
			</CardHeader>
			<CardContent className="pt-0 text-muted-foreground">{description}</CardContent>
		</Card>
	);
}

export function StatusBadge({ status }: { status: string }) {
	if (status === "indexed" || status === "ready") {
		return <Badge variant="success">{status}</Badge>;
	}

	if (status === "pending" || status === "indexing") {
		return <Badge variant="warning">{status}</Badge>;
	}

	if (status === "failed") {
		return <Badge variant="destructive">{status}</Badge>;
	}

	return <Badge variant="outline">{status}</Badge>;
}

export function formatDate(value: string) {
	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export function formatBytes(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
