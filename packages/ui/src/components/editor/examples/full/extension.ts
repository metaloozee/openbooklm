import { defineBasicExtension } from "prosekit/basic";
import { union } from "prosekit/core";
import { defineCodeBlockShiki } from "prosekit/extensions/code-block";
import type { Uploader } from "prosekit/extensions/file";
import { defineHorizontalRule } from "prosekit/extensions/horizontal-rule";
import { defineImageUploadHandler } from "prosekit/extensions/image";
import { defineMath } from "prosekit/extensions/math";
import { defineMention } from "prosekit/extensions/mention";
import { definePlaceholder } from "prosekit/extensions/placeholder";

import { renderKaTeXMathBlock, renderKaTeXMathInline } from "../../sample/katex";
import { defineCodeBlockView } from "../../ui/code-block-view";
import { defineImageView } from "../../ui/image-view";

export function defineExtension(options?: { uploader?: Uploader<string> }) {
	return union(
		defineBasicExtension(),
		definePlaceholder({ placeholder: "Press / for commands..." }),
		defineMention(),
		defineMath({
			renderMathBlock: renderKaTeXMathBlock,
			renderMathInline: renderKaTeXMathInline,
		}),
		defineCodeBlockShiki(),
		defineHorizontalRule(),
		defineCodeBlockView(),
		defineImageView(),
		...(options?.uploader
			? [
					defineImageUploadHandler({
						uploader: options.uploader,
					}),
				]
			: []),
	);
}

export type EditorExtension = ReturnType<typeof defineExtension>;
