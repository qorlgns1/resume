"use client";

import {
  BlockNoteSchema,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";

/*
 * 편집기에서 쓸 수 있는 블록을 우리가 저장하는 블록 종류(@resume/contracts BlockSchema)로만 제한한다.
 * 색·밑줄·코드 블록 등 저장 형식에 없는 기능은 처음부터 고를 수 없게 한다.
 */

const calloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: { tone: { default: "info", values: ["info", "warning"] as const } },
    content: "inline",
  },
  {
    render: ({ block, contentRef }) => (
      <div
        data-tone={block.props.tone}
        className="flex w-full gap-2 rounded-md bg-primary-soft px-3 py-2 data-[tone=warning]:bg-warning-soft"
      >
        <span aria-hidden="true">{block.props.tone === "warning" ? "⚠️" : "💡"}</span>
        <div ref={contentRef} className="flex-1" />
      </div>
    ),
  },
);

export const editorSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: createHeadingBlockSpec({
      levels: [2, 3],
      defaultLevel: 2,
      allowToggleHeadings: false,
    }),
    bulletListItem: defaultBlockSpecs.bulletListItem,
    quote: defaultBlockSpecs.quote,
    divider: defaultBlockSpecs.divider,
    image: defaultBlockSpecs.image,
    table: defaultBlockSpecs.table,
    callout: calloutBlock(),
  },
  styleSpecs: {
    bold: defaultStyleSpecs.bold,
    italic: defaultStyleSpecs.italic,
    code: defaultStyleSpecs.code,
  },
});

export type EditorSchema = typeof editorSchema;
export type EditorBlock = EditorSchema["Block"];
export type EditorPartialBlock = EditorSchema["PartialBlock"];
