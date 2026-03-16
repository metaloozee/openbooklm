"use client";

import * as React from "react";
import { Badge } from "@openbooklm/ui/components/badge";
import { Button } from "@openbooklm/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@openbooklm/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@openbooklm/ui/components/empty";
import {
	Select as UiSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@openbooklm/ui/components/select";
import { cn } from "@openbooklm/ui/lib/utils";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

type SelectProps = {
	id?: string;
	name?: string;
	value?: string;
	defaultValue?: string;
	disabled?: boolean;
	placeholder?: string;
	children?: React.ReactNode;
	onBlur?: () => void;
	onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

export function Select({
	id,
	name,
	value,
	defaultValue,
	disabled,
	placeholder,
	children,
	onBlur,
	onChange,
}: SelectProps) {
	const options = React.Children.toArray(children)
		.filter((child): child is React.ReactElement => React.isValidElement(child))
		.filter((child) => child.type === "option")
		.map((child) => {
			const childProps = child.props as {
				value?: string;
				disabled?: boolean;
				children?: React.ReactNode;
			};

			return {
				value: String(childProps.value ?? ""),
				disabled: childProps.disabled,
				label: childProps.children,
			};
		});

	const selectedLabel = options.find((option) => option.value === value)?.label;

	return (
		<UiSelect
			name={name}
			value={value}
			defaultValue={defaultValue}
			disabled={disabled}
			onValueChange={(nextValue) => {
				onChange?.({
					target: {
						value: nextValue,
						name,
					},
				} as React.ChangeEvent<HTMLSelectElement>);
			}}
		>
			<SelectTrigger id={id} onBlur={onBlur} className="w-full">
				<SelectValue placeholder={placeholder ?? "Select an option"}>
					{selectedLabel}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value} disabled={option.disabled}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</UiSelect>
	);
}

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
		<div className={cn("flex flex-col gap-1", className)}>
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

export function QueryErrorState({
	title = "Unable to load data",
	description,
	onRetry,
}: {
	title?: string;
	description: string;
	onRetry?: () => void;
}) {
	return (
		<Empty className="border">
			<EmptyHeader>
				<EmptyMedia variant={"icon"}>
					<AlertCircleIcon />
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			{onRetry ? (
				<Button variant="outline" size="sm" onClick={onRetry}>
					<RefreshCwIcon data-icon="inline-start" />
					Retry
				</Button>
			) : null}
		</Empty>
	);
}

export function StatCard({
	label,
	value,
	description,
	icon: Icon,
}: {
	label: string;
	value: string | number;
	description: string;
	icon?: React.ComponentType<{ className?: string }>;
}) {
	return (
		<Card size="sm">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardDescription>{label}</CardDescription>
					{Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
				</div>
				<CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
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
