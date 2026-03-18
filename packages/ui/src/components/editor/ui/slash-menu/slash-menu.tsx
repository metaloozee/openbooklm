import type { BasicExtension } from "prosekit/basic";
import { canUseRegexLookbehind } from "prosekit/core";
import { useEditor } from "prosekit/react";
import { AutocompleteList, AutocompletePopover } from "prosekit/react/autocomplete";

import SlashMenuEmpty from "./slash-menu-empty";
import SlashMenuItem from "./slash-menu-item";

// Match inputs like "/", "/table", "/heading 1" etc. Do not match "/ heading".
const regex = canUseRegexLookbehind() ? /(?<!\S)\/(\S.*)?$/u : /(?:^|\s)\/(\S.*)?$/u;

export default function SlashMenu() {
	const editor = useEditor<BasicExtension>();
	const menuItems = [
		{ label: "Text", onSelect: () => editor.commands.setParagraph() },
		{ label: "Heading 1", kbd: "#", onSelect: () => editor.commands.setHeading({ level: 1 }) },
		{
			label: "Heading 2",
			kbd: "##",
			onSelect: () => editor.commands.setHeading({ level: 2 }),
		},
		{
			label: "Heading 3",
			kbd: "###",
			onSelect: () => editor.commands.setHeading({ level: 3 }),
		},
		{
			label: "Bullet list",
			kbd: "-",
			onSelect: () => editor.commands.wrapInList({ kind: "bullet" }),
		},
		{
			label: "Ordered list",
			kbd: "1.",
			onSelect: () => editor.commands.wrapInList({ kind: "ordered" }),
		},
		{
			label: "Task list",
			kbd: "[]",
			onSelect: () => editor.commands.wrapInList({ kind: "task" }),
		},
		{
			label: "Toggle list",
			kbd: ">>",
			onSelect: () => editor.commands.wrapInList({ kind: "toggle" }),
		},
		{ label: "Quote", kbd: ">", onSelect: () => editor.commands.setBlockquote() },
		{
			label: "Table",
			onSelect: () => editor.commands.insertTable({ row: 3, col: 3 }),
		},
		{
			label: "Divider",
			kbd: "---",
			onSelect: () => editor.commands.insertHorizontalRule(),
		},
		{
			label: "Code",
			kbd: "```",
			onSelect: () => editor.commands.setCodeBlock(),
		},
	];

	return (
		<AutocompletePopover
			regex={regex}
			className="relative block max-h-100 min-w-60 select-none overflow-auto whitespace-nowrap p-1 z-10 box-border rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg [&:not([data-state])]:hidden"
		>
			<AutocompleteList>
				{menuItems.map((item) => (
					<SlashMenuItem
						key={item.label}
						label={item.label}
						kbd={item.kbd}
						onSelect={item.onSelect}
					/>
				))}

				<SlashMenuEmpty />
			</AutocompleteList>
		</AutocompletePopover>
	);
}
