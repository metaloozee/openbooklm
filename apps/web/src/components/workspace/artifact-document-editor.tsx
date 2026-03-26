"use client";

import { Button } from "@openbooklm/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@openbooklm/ui/components/dropdown-menu";
import { cn } from "@openbooklm/ui/lib/utils";
import type { JSONContent } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import {
	EditorContent,
	EditorContext,
	useEditor,
	useEditorState,
	type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	BoldIcon,
	Code2Icon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	MinusIcon,
	PilcrowIcon,
	QuoteIcon,
	Redo2Icon,
	SparklesIcon,
	StrikethroughIcon,
	Table2Icon,
	Undo2Icon,
} from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type SaveState = "idle" | "saving" | "saved" | "error";

type SavePayload = {
	contentJson: JSONContent;
	contentText: string;
	serializedJson: string;
};

type ArtifactListItem = {
	id: string;
	projectId: string;
	title: string;
	type: string;
	contentPreview: string;
	sourceIds: string[];
	sourceTitles: string[];
	createdAt: string;
	updatedAt: string;
};

type ArtifactDetailData = ArtifactListItem & {
	content: string;
	contentJson: Record<string, unknown> | null;
};

type ProjectListItem = {
	id: string;
	updatedAt: string;
};

type ProjectDetailData = {
	project: {
		updatedAt: string;
	};
	recentArtifacts: Array<{
		id: string;
		title: string;
		type: string;
		sourceCount: number;
		sourceTitles: string[];
		updatedAt: string;
	}>;
};

function isDocumentContent(value: unknown): value is JSONContent {
	if (!value || typeof value !== "object") {
		return false;
	}

	return "type" in value && typeof value.type === "string" && value.type === "doc";
}

function createParagraphNode(value: string): JSONContent {
	const lines = value.split("\n");
	const content: JSONContent[] = [];

	lines.forEach((line, index) => {
		if (line.length > 0) {
			content.push({
				type: "text",
				text: line,
			});
		}

		if (index < lines.length - 1) {
			content.push({
				type: "hardBreak",
			});
		}
	});

	return {
		type: "paragraph",
		...(content.length > 0 ? { content } : {}),
	};
}

function createDocumentFromText(value: string): JSONContent {
	const normalized = value.replace(/\r\n/g, "\n").trimEnd();

	if (!normalized.trim()) {
		return {
			type: "doc",
			content: [{ type: "paragraph" }],
		};
	}

	const paragraphs = normalized
		.split(/\n{2,}/)
		.filter((paragraph) => paragraph.length > 0)
		.map((paragraph) => createParagraphNode(paragraph));

	return {
		type: "doc",
		content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
	};
}

function createSavePayload(editor: Editor): SavePayload {
	const contentJson = editor.getJSON();
	const contentText = editor.getText({
		blockSeparator: "\n\n",
	});

	return {
		contentJson,
		contentText,
		serializedJson: JSON.stringify(contentJson),
	};
}

function getContentPreview(content: string) {
	return content.length > 180 ? `${content.slice(0, 177)}...` : content;
}

function sortByUpdatedAtDesc<T extends { updatedAt: string }>(items: T[]) {
	return [...items].sort((left, right) => {
		return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
	});
}

function normalizeLinkHref(value: string) {
	const trimmedValue = value.trim();

	if (!trimmedValue) {
		return "";
	}

	const schemeMatch = trimmedValue.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/);
	if (schemeMatch) {
		const scheme = schemeMatch[0].toLowerCase().replace(/:$/, "");
		const allowedSchemes = ["http", "https", "mailto", "tel"];
		if (allowedSchemes.includes(scheme)) {
			return trimmedValue;
		}
		// For disallowed schemes, return empty string to remove the link
		return "";
	}

	return `https://${trimmedValue}`;
}

function ToolbarButton({
	label,
	onClick,
	icon: Icon,
	disabled,
	pressed = false,
}: {
	label: string;
	onClick: () => void;
	icon: React.ComponentType<{ className?: string }>;
	disabled?: boolean;
	pressed?: boolean;
}) {
	return (
		<Button
			type="button"
			variant={pressed ? "secondary" : "ghost"}
			size="icon-sm"
			aria-label={label}
			aria-pressed={pressed}
			title={label}
			disabled={disabled}
			onClick={onClick}
		>
			<Icon className="size-3.5" />
		</Button>
	);
}

function ArtifactEditorToolbar({
	editor,
	saveState,
	onRetry,
	onSetLink,
}: {
	editor: Editor | null;
	saveState: SaveState;
	onRetry: () => void;
	onSetLink: () => void;
}) {
	const editorState = useEditorState({
		editor,
		selector: ({ editor: currentEditor }) => ({
			isParagraph: currentEditor?.isActive("paragraph") ?? false,
			isHeading1: currentEditor?.isActive("heading", { level: 1 }) ?? false,
			isHeading2: currentEditor?.isActive("heading", { level: 2 }) ?? false,
			isHeading3: currentEditor?.isActive("heading", { level: 3 }) ?? false,
			isBold: currentEditor?.isActive("bold") ?? false,
			isItalic: currentEditor?.isActive("italic") ?? false,
			isStrike: currentEditor?.isActive("strike") ?? false,
			isBulletList: currentEditor?.isActive("bulletList") ?? false,
			isOrderedList: currentEditor?.isActive("orderedList") ?? false,
			isBlockquote: currentEditor?.isActive("blockquote") ?? false,
			isCode: currentEditor?.isActive("code") ?? false,
			isCodeBlock: currentEditor?.isActive("codeBlock") ?? false,
			isLink: currentEditor?.isActive("link") ?? false,
			isTable: currentEditor?.isActive("table") ?? false,
			canUndo: currentEditor?.can().chain().focus().undo().run() ?? false,
			canRedo: currentEditor?.can().chain().focus().redo().run() ?? false,
			canInsertTable:
				currentEditor
					?.can()
					.chain()
					.focus()
					.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
					.run() ?? false,
			canAddColumnBefore:
				currentEditor?.can().chain().focus().addColumnBefore().run() ?? false,
			canAddColumnAfter: currentEditor?.can().chain().focus().addColumnAfter().run() ?? false,
			canDeleteColumn: currentEditor?.can().chain().focus().deleteColumn().run() ?? false,
			canAddRowBefore: currentEditor?.can().chain().focus().addRowBefore().run() ?? false,
			canAddRowAfter: currentEditor?.can().chain().focus().addRowAfter().run() ?? false,
			canDeleteRow: currentEditor?.can().chain().focus().deleteRow().run() ?? false,
			canDeleteTable: currentEditor?.can().chain().focus().deleteTable().run() ?? false,
			canMergeOrSplit: currentEditor?.can().chain().focus().mergeOrSplit().run() ?? false,
			canToggleHeaderRow:
				currentEditor?.can().chain().focus().toggleHeaderRow().run() ?? false,
			canToggleHeaderColumn:
				currentEditor?.can().chain().focus().toggleHeaderColumn().run() ?? false,
		}),
	});

	return (
		<div className="flex flex-wrap items-start justify-between border-b bg-none p-2 ">
			<div className="flex flex-1 flex-wrap items-center gap-1">
				<ToolbarButton
					label="Paragraph"
					icon={PilcrowIcon}
					pressed={editorState?.isParagraph ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().setParagraph().run()}
				/>
				<ToolbarButton
					label="Heading 1"
					icon={Heading1Icon}
					pressed={editorState?.isHeading1 ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
				/>
				<ToolbarButton
					label="Heading 2"
					icon={Heading2Icon}
					pressed={editorState?.isHeading2 ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				/>
				<ToolbarButton
					label="Heading 3"
					icon={Heading3Icon}
					pressed={editorState?.isHeading3 ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
				/>
				<div className="mx-1 h-5 w-px bg-border" />
				<ToolbarButton
					label="Bold"
					icon={BoldIcon}
					pressed={editorState?.isBold ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleBold().run()}
				/>
				<ToolbarButton
					label="Italic"
					icon={ItalicIcon}
					pressed={editorState?.isItalic ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleItalic().run()}
				/>
				<ToolbarButton
					label="Strike"
					icon={StrikethroughIcon}
					pressed={editorState?.isStrike ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleStrike().run()}
				/>
				<ToolbarButton
					label="Link"
					icon={LinkIcon}
					pressed={editorState?.isLink ?? false}
					disabled={!editor}
					onClick={onSetLink}
				/>
				<div className="mx-1 h-5 w-px bg-border" />
				<ToolbarButton
					label="Bullet list"
					icon={ListIcon}
					pressed={editorState?.isBulletList ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleBulletList().run()}
				/>
				<ToolbarButton
					label="Ordered list"
					icon={ListOrderedIcon}
					pressed={editorState?.isOrderedList ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleOrderedList().run()}
				/>
				<ToolbarButton
					label="Blockquote"
					icon={QuoteIcon}
					pressed={editorState?.isBlockquote ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleBlockquote().run()}
				/>
				<ToolbarButton
					label="Inline code"
					icon={Code2Icon}
					pressed={editorState?.isCode ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleCode().run()}
				/>
				<ToolbarButton
					label="Code block"
					icon={SparklesIcon}
					pressed={editorState?.isCodeBlock ?? false}
					disabled={!editor}
					onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
				/>
				<ToolbarButton
					label="Horizontal rule"
					icon={MinusIcon}
					disabled={!editor}
					onClick={() => editor?.chain().focus().setHorizontalRule().run()}
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant={editorState.isTable ? "secondary" : "ghost"}
							size="icon-sm"
							aria-label="Table actions"
							title="Table actions"
							disabled={!editor}
						>
							<Table2Icon className="size-3.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-52">
						<DropdownMenuItem
							disabled={!editorState.canInsertTable}
							onClick={() =>
								editor
									?.chain()
									.focus()
									.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
									.run()
							}
						>
							Insert table
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							disabled={!editorState.canAddColumnBefore}
							onClick={() => editor?.chain().focus().addColumnBefore().run()}
						>
							Add column before
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!editorState.canAddColumnAfter}
							onClick={() => editor?.chain().focus().addColumnAfter().run()}
						>
							Add column after
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!editorState.canDeleteColumn}
							onClick={() => editor?.chain().focus().deleteColumn().run()}
						>
							Delete column
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							disabled={!editorState.canAddRowBefore}
							onClick={() => editor?.chain().focus().addRowBefore().run()}
						>
							Add row before
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!editorState.canAddRowAfter}
							onClick={() => editor?.chain().focus().addRowAfter().run()}
						>
							Add row after
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!editorState.canDeleteRow}
							onClick={() => editor?.chain().focus().deleteRow().run()}
						>
							Delete row
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							disabled={!editorState.canToggleHeaderRow}
							onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
						>
							Toggle header row
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!editorState.canToggleHeaderColumn}
							onClick={() => editor?.chain().focus().toggleHeaderColumn().run()}
						>
							Toggle header column
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!editorState.canMergeOrSplit}
							onClick={() => editor?.chain().focus().mergeOrSplit().run()}
						>
							Merge or split cells
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							disabled={!editorState.canDeleteTable}
							onClick={() => editor?.chain().focus().deleteTable().run()}
						>
							Delete table
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<div className="mx-1 h-5 w-px bg-border" />
				<ToolbarButton
					label="Undo"
					icon={Undo2Icon}
					disabled={!editorState.canUndo}
					onClick={() => editor?.chain().focus().undo().run()}
				/>
				<ToolbarButton
					label="Redo"
					icon={Redo2Icon}
					disabled={!editorState.canRedo}
					onClick={() => editor?.chain().focus().redo().run()}
				/>
			</div>

			<div className="flex items-center gap-2">
				{saveState == "error" ? (
					<Button type="button" variant="outline" size="xs" onClick={onRetry}>
						Retry save
					</Button>
				) : null}
			</div>
		</div>
	);
}

export function ArtifactDocumentEditor({
	projectId,
	artifactId,
	initialText,
	initialContentJson,
	onSaved,
}: {
	projectId: string;
	artifactId: string;
	initialText: string;
	initialContentJson: Record<string, unknown> | null;
	onSaved?: (updatedAt: string) => void;
}) {
	const queryClient = useQueryClient();
	const initialDocument = useMemo(
		() =>
			isDocumentContent(initialContentJson)
				? initialContentJson
				: createDocumentFromText(initialText),
		[initialContentJson, initialText],
	);
	const initialSerialized = useMemo(() => JSON.stringify(initialDocument), [initialDocument]);
	const [saveState, setSaveState] = useState<SaveState>("saved");
	const mountedRef = useRef(true);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const latestPayloadRef = useRef<SavePayload>({
		contentJson: initialDocument,
		contentText: initialText,
		serializedJson: initialSerialized,
	});
	const lastPersistedSerializedRef = useRef(initialSerialized);
	const saveInFlightRef = useRef(false);
	const pendingAfterFlightRef = useRef(false);

	const setSaveStateIfMounted = (nextState: SaveState) => {
		if (mountedRef.current) {
			setSaveState(nextState);
		}
	};

	const updateContentMutation = useMutation(trpc.artifacts.updateContent.mutationOptions());
	const artifactByIdQuery = trpc.artifacts.byId.queryOptions({ projectId, artifactId });
	const artifactsListQuery = trpc.artifacts.list.queryOptions({ projectId });
	const projectByIdQuery = trpc.projects.byId.queryOptions({ projectId });
	const projectsListQuery = trpc.projects.list.queryOptions();

	const commitLatest = useEffectEvent(async () => {
		const nextPayload = latestPayloadRef.current;

		if (nextPayload.serializedJson === lastPersistedSerializedRef.current) {
			setSaveStateIfMounted("saved");
			return;
		}

		if (saveInFlightRef.current) {
			pendingAfterFlightRef.current = true;
			return;
		}

		saveInFlightRef.current = true;
		pendingAfterFlightRef.current = false;
		setSaveStateIfMounted("saving");

		try {
			const result = await updateContentMutation.mutateAsync({
				projectId,
				artifactId,
				contentText: nextPayload.contentText,
				contentJson: nextPayload.contentJson,
			});

			queryClient.setQueryData<ArtifactDetailData | undefined>(
				artifactByIdQuery.queryKey,
				(current) =>
					current
						? {
								...current,
								content: nextPayload.contentText,
								contentJson: nextPayload.contentJson,
								contentPreview: getContentPreview(nextPayload.contentText),
								updatedAt: result.updatedAt,
							}
						: current,
			);
			queryClient.setQueryData<ArtifactListItem[] | undefined>(
				artifactsListQuery.queryKey,
				(current) =>
					current
						? sortByUpdatedAtDesc(
								current.map((item) =>
									item.id === artifactId
										? {
												...item,
												contentPreview: getContentPreview(
													nextPayload.contentText,
												),
												updatedAt: result.updatedAt,
											}
										: item,
								),
							)
						: current,
			);
			queryClient.setQueryData<ProjectDetailData | undefined>(
				projectByIdQuery.queryKey,
				(current) =>
					current
						? {
								...current,
								project: {
									...current.project,
									updatedAt: result.updatedAt,
								},
								recentArtifacts: sortByUpdatedAtDesc(
									current.recentArtifacts.map((item) =>
										item.id === artifactId
											? {
													...item,
													updatedAt: result.updatedAt,
												}
											: item,
									),
								).slice(0, 5),
							}
						: current,
			);
			queryClient.setQueryData<ProjectListItem[] | undefined>(
				projectsListQuery.queryKey,
				(current) =>
					current
						? sortByUpdatedAtDesc(
								current.map((item) =>
									item.id === projectId
										? {
												...item,
												updatedAt: result.updatedAt,
											}
										: item,
								),
							)
						: current,
			);

			lastPersistedSerializedRef.current = nextPayload.serializedJson;
			onSaved?.(result.updatedAt);
			setSaveStateIfMounted(
				latestPayloadRef.current.serializedJson === nextPayload.serializedJson
					? "saved"
					: "saving",
			);
		} catch (error) {
			setSaveStateIfMounted("error");

			if (mountedRef.current) {
				toast.error(error instanceof Error ? error.message : "Failed to save artifact");
			}
		} finally {
			saveInFlightRef.current = false;
		}

		if (
			pendingAfterFlightRef.current ||
			latestPayloadRef.current.serializedJson !== lastPersistedSerializedRef.current
		) {
			pendingAfterFlightRef.current = false;
			void commitLatest();
		}
	});

	const queueSave = useEffectEvent((payload: SavePayload) => {
		latestPayloadRef.current = payload;

		if (payload.serializedJson === lastPersistedSerializedRef.current) {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
				saveTimerRef.current = null;
			}

			setSaveStateIfMounted("saved");
			return;
		}

		setSaveStateIfMounted("saving");

		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}

		saveTimerRef.current = setTimeout(() => {
			saveTimerRef.current = null;
			void commitLatest();
		}, 900);
	});

	const editor = useEditor({
		immediatelyRender: false,
		content: initialDocument,
		extensions: [
			StarterKit.configure({
				link: {
					openOnClick: false,
					autolink: true,
					linkOnPaste: true,
				},
			}),
			Placeholder.configure({
				placeholder: "Start shaping this artifact...",
			}),
			TableKit.configure({
				table: {
					resizable: true,
				},
			}),
		],
		editorProps: {
			attributes: {
				class: cn(
					"ProseMirror  max-w-none px-5 py-5 text-sm leading-7 outline-none",
					"focus-visible:outline-none",
				),
			},
		},
		onUpdate: ({ editor: currentEditor }) => {
			queueSave(createSavePayload(currentEditor));
		},
	});

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (latestPayloadRef.current.serializedJson !== lastPersistedSerializedRef.current) {
				// Warn user about unsaved changes
				event.preventDefault();
				event.returnValue = "";
			}
		};

		return () => {
			mountedRef.current = false;
			window.removeEventListener("beforeunload", handleBeforeUnload);

			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
				saveTimerRef.current = null;
			}

			if (latestPayloadRef.current.serializedJson !== lastPersistedSerializedRef.current) {
				void commitLatest();
			}
		};
	}, [commitLatest]);

	const providerValue = useMemo(() => ({ editor }), [editor]);

	const handleRetry = () => {
		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
			saveTimerRef.current = null;
		}

		void commitLatest();
	};

	const handleSetLink = () => {
		if (!editor) {
			return;
		}

		const currentHref = editor.getAttributes("link").href as string | undefined;
		const nextHref = window.prompt(
			"Enter a URL. Leave blank to remove the link.",
			currentHref ?? "https://",
		);

		if (nextHref === null) {
			return;
		}

		const normalizedHref = normalizeLinkHref(nextHref);

		if (!normalizedHref) {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedHref }).run();
	};

	if (!editor) {
		return <div className="min-h-[32rem] flex-1 bg-background" />;
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col bg-background border rounded-md">
			<EditorContext.Provider value={providerValue}>
				<ArtifactEditorToolbar
					editor={editor}
					saveState={saveState}
					onRetry={handleRetry}
					onSetLink={handleSetLink}
				/>
				<EditorContent editor={editor} className="artifact-editor overflow-hidden " />
			</EditorContext.Provider>
		</div>
	);
}
