"use client";

import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

import { Button } from "@openbooklm/ui/components/button";
import { Separator } from "@openbooklm/ui/components/separator";
import { Spinner } from "@openbooklm/ui/components/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@openbooklm/ui/components/tooltip";
import { cn } from "@openbooklm/ui/lib/utils";
import type { BasicExtension } from "prosekit/basic";
import { createEditor, type NodeJSON } from "prosekit/core";
import type { Uploader } from "prosekit/extensions/file";
import { ProseKit, useDocChange, useEditor } from "prosekit/react";
import {
	BoldIcon,
	Code2Icon,
	ImageIcon,
	ItalicIcon,
	ListChecksIcon,
	ListIcon,
	ListOrderedIcon,
	MinusIcon,
	QuoteIcon,
	SaveIcon,
	Table2Icon,
	UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { defineExtension } from "./editor/examples/full/extension";
import { DropIndicator } from "./editor/ui/drop-indicator";
import { ImageUploadPopover } from "./editor/ui/image-upload-popover";
import { SlashMenu } from "./editor/ui/slash-menu";
import { TableHandle } from "./editor/ui/table-handle";

type SaveState = "saved" | "unsaved" | "saving" | "error";

export type ArtifactSavePayload = {
	title: string;
	content: string;
	contentJson: string;
};

export type ArtifactEditorProps = {
	title: string;
	content: string;
	contentJson?: string | null;
	updatedAtLabel: string;
	onSave: (payload: ArtifactSavePayload) => Promise<void>;
	uploader?: Uploader<string>;
	className?: string;
};

function markdownFromHTML(html: string): string {
	return unified()
		.use(rehypeParse, { fragment: true })
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(remarkStringify)
		.processSync(html)
		.toString();
}

function htmlFromMarkdown(markdown: string): string {
	return unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkHtml)
		.processSync(markdown)
		.toString();
}

function toNodeJson(contentJson?: string | null): NodeJSON | undefined {
	if (!contentJson) {
		return undefined;
	}

	try {
		return JSON.parse(contentJson) as NodeJSON;
	} catch {
		return undefined;
	}
}

function getInitialContent(content: string, contentJson?: string | null): string | NodeJSON {
	const parsed = toNodeJson(contentJson);
	if (parsed) {
		return parsed;
	}

	return content.trim() ? htmlFromMarkdown(content) : "<p></p>";
}

function SaveIndicator({ state, updatedAtLabel }: { state: SaveState; updatedAtLabel: string }) {
	if (state === "saving") {
		return "Saving changes...";
	}

	if (state === "error") {
		return "Save failed. Changes remain local until the next save succeeds.";
	}

	if (state === "unsaved") {
		return "Unsaved changes";
	}

	return `Last saved ${updatedAtLabel}`;
}

function getSaveButtonTooltip(state: SaveState, updatedAtLabel: string) {
	return SaveIndicator({ state, updatedAtLabel });
}

function ToolbarToggle({
	pressed,
	disabled,
	onClick,
	children,
}: {
	pressed?: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Button
			type="button"
			variant={pressed ? "secondary" : "ghost"}
			size="sm"
			disabled={disabled}
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
		>
			{children}
		</Button>
	);
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
	return (
		<div className="inline-flex h-8 items-center gap-1 rounded-lg border bg-muted/30 p-1 shadow-xs">
			{children}
		</div>
	);
}

function safely<T>(callback: () => T, fallback: T) {
	try {
		return callback();
	} catch {
		return fallback;
	}
}

function ArtifactToolbar({
	uploader,
	saveState,
	updatedAtLabel,
	onSaveNow,
	isSaveDisabled,
}: {
	uploader?: Uploader<string>;
	saveState: SaveState;
	updatedAtLabel: string;
	onSaveNow: () => void;
	isSaveDisabled: boolean;
}) {
	const editor = useEditor<BasicExtension>({ update: true });
	const toolbarState = {
		bold: {
			pressed: safely(() => editor.marks.bold?.isActive() ?? false, false),
			canExec: safely(() => editor.commands.toggleBold?.canExec() ?? false, false),
		},
		italic: {
			pressed: safely(() => editor.marks.italic?.isActive() ?? false, false),
			canExec: safely(() => editor.commands.toggleItalic?.canExec() ?? false, false),
		},
		underline: {
			pressed: safely(() => editor.marks.underline?.isActive() ?? false, false),
			canExec: safely(() => editor.commands.toggleUnderline?.canExec() ?? false, false),
		},
		heading1: {
			pressed: safely(() => editor.nodes.heading?.isActive({ level: 1 }) ?? false, false),
			canExec: safely(
				() => editor.commands.toggleHeading?.canExec({ level: 1 }) ?? false,
				false,
			),
		},
		heading2: {
			pressed: safely(() => editor.nodes.heading?.isActive({ level: 2 }) ?? false, false),
			canExec: safely(
				() => editor.commands.toggleHeading?.canExec({ level: 2 }) ?? false,
				false,
			),
		},
		heading3: {
			pressed: safely(() => editor.nodes.heading?.isActive({ level: 3 }) ?? false, false),
			canExec: safely(
				() => editor.commands.toggleHeading?.canExec({ level: 3 }) ?? false,
				false,
			),
		},
		blockquote: {
			pressed: safely(() => editor.nodes.blockquote?.isActive() ?? false, false),
			canExec: safely(() => editor.commands.toggleBlockquote?.canExec() ?? false, false),
		},
		bulletList: {
			pressed: safely(() => editor.nodes.list?.isActive({ kind: "bullet" }) ?? false, false),
			canExec: safely(
				() => editor.commands.toggleList?.canExec({ kind: "bullet" }) ?? false,
				false,
			),
		},
		orderedList: {
			pressed: safely(() => editor.nodes.list?.isActive({ kind: "ordered" }) ?? false, false),
			canExec: safely(
				() => editor.commands.toggleList?.canExec({ kind: "ordered" }) ?? false,
				false,
			),
		},
		taskList: {
			pressed: safely(() => editor.nodes.list?.isActive({ kind: "task" }) ?? false, false),
			canExec: safely(
				() => editor.commands.toggleList?.canExec({ kind: "task" }) ?? false,
				false,
			),
		},
		codeBlock: {
			pressed: safely(() => editor.nodes.codeBlock?.isActive() ?? false, false),
			canExec: safely(
				() => editor.commands.insertCodeBlock?.canExec({ language: "typescript" }) ?? false,
				false,
			),
		},
		table: {
			pressed: safely(() => editor.nodes.table?.isActive() ?? false, false),
			canExec: safely(
				() =>
					editor.commands.insertTable?.canExec({ row: 3, col: 3, header: true }) ?? false,
				false,
			),
		},
		horizontalRule: {
			pressed: safely(() => editor.nodes.horizontalRule?.isActive() ?? false, false),
			canExec: safely(() => editor.commands.insertHorizontalRule?.canExec() ?? false, false),
		},
		image: {
			canExec: safely(() => editor.commands.insertImage?.canExec() ?? false, false),
		},
	};

	return (
		<TooltipProvider>
			<div className="flex items-center justify-between gap-3 border-b bg-card px-3 py-2">
				<div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
					<ToolbarGroup>
						<ToolbarToggle
							pressed={toolbarState.bold.pressed}
							disabled={!toolbarState.bold.canExec}
							onClick={() => editor.commands.toggleBold?.()}
						>
							<BoldIcon data-icon="inline-start" />
							Bold
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.italic.pressed}
							disabled={!toolbarState.italic.canExec}
							onClick={() => editor.commands.toggleItalic?.()}
						>
							<ItalicIcon data-icon="inline-start" />
							Italic
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.underline.pressed}
							disabled={!toolbarState.underline.canExec}
							onClick={() => editor.commands.toggleUnderline?.()}
						>
							<UnderlineIcon data-icon="inline-start" />
							Underline
						</ToolbarToggle>
					</ToolbarGroup>

					<ToolbarGroup>
						<ToolbarToggle
							pressed={toolbarState.heading1.pressed}
							disabled={!toolbarState.heading1.canExec}
							onClick={() => editor.commands.toggleHeading?.({ level: 1 })}
						>
							H1
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.heading2.pressed}
							disabled={!toolbarState.heading2.canExec}
							onClick={() => editor.commands.toggleHeading?.({ level: 2 })}
						>
							H2
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.heading3.pressed}
							disabled={!toolbarState.heading3.canExec}
							onClick={() => editor.commands.toggleHeading?.({ level: 3 })}
						>
							H3
						</ToolbarToggle>
					</ToolbarGroup>

					<ToolbarGroup>
						<ToolbarToggle
							pressed={toolbarState.blockquote.pressed}
							disabled={!toolbarState.blockquote.canExec}
							onClick={() => editor.commands.toggleBlockquote?.()}
						>
							<QuoteIcon data-icon="inline-start" />
							Quote
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.bulletList.pressed}
							disabled={!toolbarState.bulletList.canExec}
							onClick={() => editor.commands.toggleList?.({ kind: "bullet" })}
						>
							<ListIcon data-icon="inline-start" />
							Bullets
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.orderedList.pressed}
							disabled={!toolbarState.orderedList.canExec}
							onClick={() => editor.commands.toggleList?.({ kind: "ordered" })}
						>
							<ListOrderedIcon data-icon="inline-start" />
							Numbered
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.taskList.pressed}
							disabled={!toolbarState.taskList.canExec}
							onClick={() => editor.commands.toggleList?.({ kind: "task" })}
						>
							<ListChecksIcon data-icon="inline-start" />
							Tasks
						</ToolbarToggle>
					</ToolbarGroup>

					<ToolbarGroup>
						<ToolbarToggle
							pressed={toolbarState.codeBlock.pressed}
							disabled={!toolbarState.codeBlock.canExec}
							onClick={() =>
								editor.commands.insertCodeBlock?.({ language: "typescript" })
							}
						>
							<Code2Icon data-icon="inline-start" />
							Code Block
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.table.pressed}
							disabled={!toolbarState.table.canExec}
							onClick={() =>
								editor.commands.insertTable?.({ row: 3, col: 3, header: true })
							}
						>
							<Table2Icon data-icon="inline-start" />
							Table
						</ToolbarToggle>
						<ToolbarToggle
							pressed={toolbarState.horizontalRule.pressed}
							disabled={!toolbarState.horizontalRule.canExec}
							onClick={() => editor.commands.insertHorizontalRule?.()}
						>
							<MinusIcon data-icon="inline-start" />
							Divider
						</ToolbarToggle>

						{uploader ? (
							<>
								<Separator orientation="vertical" className="mx-1 h-5" />
								<ImageUploadPopover
									uploader={uploader}
									disabled={!toolbarState.image.canExec}
									tooltip="Insert image"
								>
									<ImageIcon className="size-4" />
									<span className="ml-1">Image</span>
								</ImageUploadPopover>
							</>
						) : null}
					</ToolbarGroup>
				</div>

				<div className="flex shrink-0 items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								onClick={onSaveNow}
								disabled={isSaveDisabled}
								className="mt-0.5 shadow-xs"
							>
								{saveState === "saving" ? (
									<Spinner size="sm" />
								) : (
									<SaveIcon className="size-4" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{getSaveButtonTooltip(saveState, updatedAtLabel)}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</TooltipProvider>
	);
}

export function ArtifactEditor({
	title: _title,
	content,
	contentJson,
	updatedAtLabel,
	onSave,
	uploader,
	className,
}: ArtifactEditorProps) {
	const initialContent = useMemo(
		() => getInitialContent(content, contentJson),
		[content, contentJson],
	);

	const editor = useMemo(
		() =>
			createEditor({
				extension: defineExtension({ uploader }),
				defaultContent: initialContent,
			}),
		[],
	);

	const [saveState, setSaveState] = useState<SaveState>("saved");
	const lastSavedPayloadRef = useRef<ArtifactSavePayload>({
		title: _title,
		content,
		contentJson: contentJson ?? JSON.stringify(editor.getDocJSON()),
	});
	const saveSequenceRef = useRef(0);
	const lastCompletedSaveRef = useRef(0);

	useEffect(() => {
		if (saveState === "unsaved" || saveState === "saving") {
			return;
		}

		lastSavedPayloadRef.current = {
			title: _title,
			content,
			contentJson: contentJson ?? JSON.stringify(editor.getDocJSON()),
		};
		setSaveState("saved");
	}, [content, contentJson, editor, saveState, _title]);

	const buildPayload = useCallback((): ArtifactSavePayload => {
		return {
			title: _title,
			content: markdownFromHTML(editor.getDocHTML()).trim(),
			contentJson: JSON.stringify(editor.getDocJSON()),
		};
	}, [editor, _title]);

	const flushSave = useCallback(async () => {
		const nextPayload = buildPayload();
		const previousPayload = lastSavedPayloadRef.current;

		if (
			nextPayload.title === previousPayload.title &&
			nextPayload.content === previousPayload.content &&
			nextPayload.contentJson === previousPayload.contentJson
		) {
			setSaveState("saved");
			return;
		}

		const saveId = saveSequenceRef.current + 1;
		saveSequenceRef.current = saveId;
		setSaveState("saving");

		try {
			await onSave(nextPayload);
			if (saveId < lastCompletedSaveRef.current) {
				return;
			}

			lastCompletedSaveRef.current = saveId;
			lastSavedPayloadRef.current = nextPayload;
			setSaveState("saved");
		} catch {
			if (saveId < lastCompletedSaveRef.current) {
				return;
			}

			setSaveState("error");
		}
	}, [buildPayload, onSave]);

	const handleDocChange = useCallback(() => {
		setSaveState((current) => (current === "saving" ? current : "unsaved"));
	}, []);

	useDocChange(handleDocChange, { editor });

	useEffect(() => {
		return () => {
			editor.unmount();
		};
	}, [editor]);

	return (
		<div
			className={cn(
				"artifact-editor flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
				className,
			)}
		>
			<ProseKit editor={editor}>
				<div className="flex min-h-144 flex-1 flex-col overflow-hidden rounded-b-xl bg-background">
					<ArtifactToolbar
						uploader={uploader}
						saveState={saveState}
						updatedAtLabel={updatedAtLabel}
						onSaveNow={() => {
							void flushSave();
						}}
						isSaveDisabled={saveState === "saving"}
					/>
					<div className="relative flex-1 overflow-y-auto">
						<div
							ref={editor.mount}
							className="ProseMirror min-h-full px-[clamp(1rem,5vw,4rem)] py-8 text-base outline-hidden"
						/>
						<SlashMenu />
						<TableHandle />
						<DropIndicator />
					</div>
				</div>
			</ProseKit>
		</div>
	);
}
