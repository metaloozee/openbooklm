"use client";

import { SOURCE_TYPE_OPTIONS, sourceCreateSchema } from "@openbooklm/api/contracts";
import { Button } from "@openbooklm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@openbooklm/ui/components/dialog";
import { Input } from "@openbooklm/ui/components/input";
import { Label } from "@openbooklm/ui/components/label";
import { Skeleton } from "@openbooklm/ui/components/skeleton";
import { Spinner } from "@openbooklm/ui/components/spinner";
import { Textarea } from "@openbooklm/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpenIcon, FileTextIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	FieldErrors,
	Select,
	QueryErrorState,
	StatusBadge,
	formatBytes,
	formatDate,
} from "@/components/workspace/primitives";
import { useSourceInvalidation } from "@/lib/invalidation";
import { trpc } from "@/utils/trpc";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "@openbooklm/ui/components/empty";

type TextSourceInputMode = "upload" | "paste";

function isTextSourceType(type: (typeof SOURCE_TYPE_OPTIONS)[number]) {
	return type === "text" || type === "markdown";
}

function getTypeLabel(type: (typeof SOURCE_TYPE_OPTIONS)[number]) {
	if (type === "markdown") {
		return "Markdown";
	}

	if (type === "pdf") {
		return "PDF";
	}

	if (type === "url") {
		return "URL";
	}

	return "Text";
}

export function AddSourceDialog({
	projectId,
	open,
	onOpenChange,
}: {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const invalidateProjectData = useSourceInvalidation(projectId);
	const [textInputMode, setTextInputMode] = useState<TextSourceInputMode>("paste");
	const [uploadedTextFile, setUploadedTextFile] = useState<{
		name: string;
		bytes: number;
	} | null>(null);
	const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);

	const resetTransientState = () => {
		setTextInputMode("paste");
		setUploadedTextFile(null);
		setUploadedPdfFile(null);
	};

	const createSourceMutation = useMutation(
		trpc.sources.create.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Source saved");
				resetTransientState();
				form.reset();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			projectId,
			title: "",
			type: "text" as (typeof SOURCE_TYPE_OPTIONS)[number],
			url: "",
			content: "",
		},
		validators: {
			onSubmit: sourceCreateSchema,
		},
		onSubmit: async ({ value }) => {
			if (value.type === "pdf" && !uploadedPdfFile) {
				toast.error("Choose a PDF document before saving.");
				return;
			}

			if (value.type === "pdf") {
				toast.error(
					"PDF uploads are not available yet. Use a text, markdown, or URL source for now.",
				);
				return;
			}

			if (isTextSourceType(value.type) && textInputMode === "upload" && !uploadedTextFile) {
				toast.error(
					`Choose a ${getTypeLabel(value.type).toLowerCase()} file or paste content.`,
				);
				return;
			}

			await createSourceMutation.mutateAsync({
				...value,
				url: value.type === "url" ? value.url : "",
				content: value.type === "url" || value.type === "pdf" ? "" : value.content,
			});
		},
	});

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			resetTransientState();
			form.reset();
		}

		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Add source</DialogTitle>
					<DialogDescription>
						Add a source by linking a URL or providing content that can be uploaded or
						extracted for grounding.
					</DialogDescription>
				</DialogHeader>
				<form
					noValidate
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.Field name="title">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={field.name}>Title</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Paper, article, or note title"
								/>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Field name="type">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={field.name}>Type</Label>
								<Select
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => {
										resetTransientState();
										field.handleChange(
											event.target
												.value as (typeof SOURCE_TYPE_OPTIONS)[number],
										);
									}}
								>
									{SOURCE_TYPE_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</Select>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => state.values.type}>
						{(type) =>
							type === "url" ? (
								<form.Field name="url">
									{(field) => (
										<div className="flex flex-col gap-1.5">
											<Label htmlFor={field.name}>URL</Label>
											<Input
												id={field.name}
												name={field.name}
												type="url"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												placeholder="https://example.com/article"
											/>
											<p className="text-xs/relaxed text-muted-foreground">
												Paste any link here. The backend will determine what
												the URL points to.
											</p>
											<FieldErrors errors={field.state.meta.errors} />
										</div>
									)}
								</form.Field>
							) : type === "pdf" ? (
								<div className="flex flex-col gap-3 rounded-md border p-3">
									<div className="flex flex-col gap-0.5">
										<Label htmlFor="source-pdf-upload">Upload document</Label>
										<p className="text-xs/relaxed text-muted-foreground">
											Choose the PDF document you want this source to
											represent.
										</p>
									</div>
									<Input
										id="source-pdf-upload"
										type="file"
										accept=".pdf,application/pdf"
										onChange={(event) => {
											const file = event.target.files?.[0];

											setUploadedPdfFile(file ?? null);
										}}
									/>
									{uploadedPdfFile ? (
										<p className="rounded-md bg-muted px-2 py-1.5 text-xs/relaxed text-muted-foreground">
											{uploadedPdfFile.name} ·{" "}
											{formatBytes(uploadedPdfFile.size)}
										</p>
									) : null}
									<p className="text-xs/relaxed text-muted-foreground">
										PDF selection is preserved locally, but saving stays
										disabled until the upload flow exists on the backend.
									</p>
								</div>
							) : (
								<form.Field name="content">
									{(field) => (
										<div className="flex flex-col gap-3">
											<div className="flex flex-col gap-2 rounded-md border p-3">
												<div className="flex flex-col gap-0.5">
													<Label>Input method</Label>
													<p className="text-xs/relaxed text-muted-foreground">
														Upload a {getTypeLabel(type).toLowerCase()}{" "}
														file or paste the content directly.
													</p>
												</div>
												<div className="flex flex-wrap gap-2">
													<Button
														type="button"
														size="sm"
														variant={
															textInputMode === "paste"
																? "default"
																: "outline"
														}
														onClick={() => setTextInputMode("paste")}
													>
														Paste content
													</Button>
													<Button
														type="button"
														size="sm"
														variant={
															textInputMode === "upload"
																? "default"
																: "outline"
														}
														onClick={() => setTextInputMode("upload")}
													>
														Upload file
													</Button>
												</div>
											</div>

											{textInputMode === "upload" ? (
												<div className="flex flex-col gap-1.5 rounded-md border p-3">
													<Label htmlFor={`source-${type}-upload`}>
														Upload {getTypeLabel(type)} file
													</Label>
													<Input
														id={`source-${type}-upload`}
														type="file"
														accept={
															type === "markdown"
																? ".md,.markdown,text/markdown,text/plain"
																: ".txt,text/plain"
														}
														onChange={async (event) => {
															const file = event.target.files?.[0];

															if (!file) {
																setUploadedTextFile(null);
																field.handleChange("");
																return;
															}

															try {
																const nextContent =
																	await file.text();

																setUploadedTextFile({
																	name: file.name,
																	bytes: file.size,
																});
																field.handleChange(nextContent);
															} catch {
																setUploadedTextFile(null);
																field.handleChange("");
																toast.error(
																	`Unable to read ${file.name}. Try another file.`,
																);
															}
														}}
													/>
													<p className="text-xs/relaxed text-muted-foreground">
														We will use the file contents as the source
														body.
													</p>
													{uploadedTextFile ? (
														<p className="rounded-md bg-muted px-2 py-1.5 text-xs/relaxed text-muted-foreground">
															{uploadedTextFile.name} ·{" "}
															{formatBytes(uploadedTextFile.bytes)}
														</p>
													) : null}
												</div>
											) : (
												<div className="flex flex-col gap-1.5">
													<Label htmlFor={field.name}>Content</Label>
													<Textarea
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														placeholder={`Paste the ${getTypeLabel(type).toLowerCase()} content you want indexed.`}
														className="min-h-28 resize-none"
													/>
												</div>
											)}

											<FieldErrors errors={field.state.meta.errors} />
										</div>
									)}
								</form.Field>
							)
						}
					</form.Subscribe>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<>
									<Button
										type="button"
										variant="outline"
										onClick={() => handleOpenChange(false)}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={
											!canSubmit ||
											isSubmitting ||
											createSourceMutation.isPending
										}
										size={
											isSubmitting || createSourceMutation.isPending
												? "icon"
												: "default"
										}
									>
										{isSubmitting || createSourceMutation.isPending ? (
											<Spinner />
										) : (
											"Save source"
										)}
									</Button>
								</>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function SourcesManager({ projectId }: { projectId: string }) {
	const [isAddOpen, setIsAddOpen] = useState(false);
	const sourcesQuery = useQuery(trpc.sources.list.queryOptions({ projectId }));
	const invalidateProjectData = useSourceInvalidation(projectId);

	const reindexSourceMutation = useMutation(
		trpc.sources.reindex.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Source marked as indexed");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const deleteSourceMutation = useMutation(
		trpc.sources.delete.mutationOptions({
			onSuccess: async () => {
				await invalidateProjectData();
				toast.success("Source removed");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-lg font-semibold tracking-tight">Sources</h1>
					<p className="text-sm text-muted-foreground">
						Add links, uploaded documents, or pasted content and manage their indexing
						state.
					</p>
				</div>
				<Button onClick={() => setIsAddOpen(true)}>
					<PlusIcon data-icon="inline-start" />
					Add source
				</Button>
			</div>

			{sourcesQuery.isPending ? (
				<div className="flex flex-col gap-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className="flex flex-col gap-3">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-3.5 w-64" />
							</CardHeader>
						</Card>
					))}
				</div>
			) : sourcesQuery.isError ? (
				<QueryErrorState
					title="Sources unavailable"
					description={sourcesQuery.error.message}
					onRetry={() => void sourcesQuery.refetch()}
				/>
			) : sourcesQuery.data?.length ? (
				<div className="flex flex-col gap-3">
					{sourcesQuery.data.map((item) => (
						<Card
							key={item.id}
							className="transition-colors hover:border-foreground/20"
						>
							<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
								<div className="flex items-start gap-3">
									<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
										<FileTextIcon className="size-4 text-muted-foreground" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<CardTitle>{item.title}</CardTitle>
											<StatusBadge status={item.status} />
										</div>
										<p className="mt-0.5 text-xs/relaxed text-muted-foreground">
											{item.type} · {formatBytes(item.contentBytes)} · updated{" "}
											{formatDate(item.updatedAt)}
										</p>
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={reindexSourceMutation.isPending}
										onClick={() =>
											reindexSourceMutation.mutate({
												projectId,
												sourceId: item.id,
											})
										}
									>
										<RefreshCwIcon data-icon="inline-start" />
										Re-index
									</Button>
									<Button
										variant="destructive"
										size="sm"
										disabled={deleteSourceMutation.isPending}
										onClick={() => {
											if (
												window.confirm(
													`Remove "${item.title}"? This is irreversible and may delete indexed data.`,
												)
											) {
												deleteSourceMutation.mutate({
													projectId,
													sourceId: item.id,
												});
											}
										}}
									>
										<Trash2Icon data-icon="inline-start" />
										Remove
									</Button>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								<div className="flex flex-wrap gap-x-6 gap-y-1 text-xs/relaxed text-muted-foreground">
									<span>Pages: {item.pageCount}</span>
									<span>Chunks: {item.chunkCount}</span>
									<span>Created: {formatDate(item.createdAt)}</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant={"icon"}>
							<BookOpenIcon />
						</EmptyMedia>
						<EmptyTitle>No sources yet</EmptyTitle>
						<EmptyDescription>
							Add a source to populate the project knowledge base and enable grounded
							conversations.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}

			<AddSourceDialog projectId={projectId} open={isAddOpen} onOpenChange={setIsAddOpen} />
		</div>
	);
}
