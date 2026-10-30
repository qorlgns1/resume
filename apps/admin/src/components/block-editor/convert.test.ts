import { type Block, BlockSchema, MAX_LIST_DEPTH, type MediaAsset } from "@resume/contracts";
import { describe, expect, it } from "vitest";
import { blocksToEditor, editorToBlocks } from "./convert";
import type { EditorBlock } from "./schema";

/*
 * BlockNote 블록은 런타임 객체이므로 필요한 필드만 가진 평범한 객체로 만든다.
 * 저장 형식(Block[])이 기준이고, 여기서 나온 결과는 항상 BlockSchema를 통과해야 한다.
 */

type Loose = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: Loose[];
};

const styled = (text: string, styles: Record<string, true> = {}) => ({
  type: "text",
  text,
  styles,
});

function editor(blocks: Loose[]): EditorBlock[] {
  const fill = (b: Loose): Loose => ({
    props: {},
    content: [],
    ...b,
    children: (b.children ?? []).map(fill),
  });
  return blocks.map(fill) as unknown as EditorBlock[];
}

function expectValid(blocks: Block[]) {
  for (const block of blocks) {
    const result = BlockSchema.safeParse(block);
    expect(result.success, result.success ? "" : result.error.message).toBe(true);
  }
}

describe("editorToBlocks", () => {
  it("converts paragraphs, headings, quotes, callouts, and dividers", () => {
    const { blocks, warnings } = editorToBlocks(
      editor([
        {
          id: "p",
          type: "paragraph",
          content: [styled("hello ", { bold: true }), styled("world")],
        },
        { id: "h2", type: "heading", props: { level: 2 }, content: [styled("Title")] },
        { id: "h1", type: "heading", props: { level: 1 }, content: [styled("Too big")] },
        { id: "q", type: "quote", content: [styled("quote")] },
        { id: "c", type: "callout", props: { tone: "warning" }, content: [styled("warn")] },
        { id: "d", type: "divider" },
      ]),
    );
    expect(warnings).toEqual([]);
    expectValid(blocks);
    expect(blocks).toEqual([
      {
        id: "p",
        type: "paragraph",
        text: [{ text: "hello ", marks: ["bold"] }, { text: "world" }],
      },
      { id: "h2", type: "heading", level: 2, text: [{ text: "Title" }] },
      // 저장 형식은 h2·h3만 있으므로 h1은 h2로 내린다.
      { id: "h1", type: "heading", level: 2, text: [{ text: "Too big" }] },
      { id: "q", type: "quote", text: [{ text: "quote" }] },
      { id: "c", type: "callout", tone: "warning", text: [{ text: "warn" }] },
      { id: "d", type: "divider" },
    ]);
  });

  it("keeps link hrefs on the spans inside the link", () => {
    const { blocks } = editorToBlocks(
      editor([
        {
          id: "p",
          type: "paragraph",
          content: [{ type: "link", href: "https://example.com", content: [styled("site")] }],
        },
      ]),
    );
    expect(blocks[0]).toEqual({
      id: "p",
      type: "paragraph",
      text: [{ text: "site", href: "https://example.com" }],
    });
  });

  it("merges consecutive list items into one list and nests children", () => {
    const { blocks, warnings } = editorToBlocks(
      editor([
        {
          id: "l1",
          type: "bulletListItem",
          content: [styled("one")],
          children: [{ id: "l1a", type: "bulletListItem", content: [styled("one-a")] }],
        },
        { id: "l2", type: "bulletListItem", content: [styled("two")] },
      ]),
    );
    expect(warnings).toEqual([]);
    expectValid(blocks);
    expect(blocks).toEqual([
      {
        id: "l1",
        type: "bulleted-list",
        items: [
          { text: [{ text: "one" }], children: [{ text: [{ text: "one-a" }] }] },
          { text: [{ text: "two" }] },
        ],
      },
    ]);
  });

  it("flattens list items deeper than MAX_LIST_DEPTH to the last allowed level", () => {
    const deep: Loose = {
      id: "l1",
      type: "bulletListItem",
      content: [styled("1")],
      children: [
        {
          id: "l2",
          type: "bulletListItem",
          content: [styled("2")],
          children: [
            {
              id: "l3",
              type: "bulletListItem",
              content: [styled("3")],
              children: [{ id: "l4", type: "bulletListItem", content: [styled("4")] }],
            },
          ],
        },
      ],
    };
    const { blocks, warnings } = editorToBlocks(editor([deep]));
    expect(warnings.join("\n")).toContain(`${MAX_LIST_DEPTH}단계`);
    expectValid(blocks);
    const list = blocks[0];
    if (list?.type !== "bulleted-list") throw new Error("expected list");
    const level3 = list.items[0]?.children?.[0]?.children;
    expect(level3?.map((i) => i.text[0]?.text)).toEqual(["3", "4"]);
  });

  it("hoists non-list blocks out of a list and warns", () => {
    const { blocks, warnings } = editorToBlocks(
      editor([
        {
          id: "l1",
          type: "bulletListItem",
          content: [styled("item")],
          children: [{ id: "p", type: "paragraph", content: [styled("inside")] }],
        },
      ]),
    );
    expect(warnings.some((w) => w.includes("목록 바로 뒤로"))).toBe(true);
    expect(blocks.map((b) => b.type)).toEqual(["bulleted-list", "paragraph"]);
  });

  it("normalizes tables to a rectangle and keeps the header flag", () => {
    const { blocks, warnings } = editorToBlocks(
      editor([
        {
          id: "t",
          type: "table",
          content: {
            type: "tableContent",
            headerRows: 1,
            rows: [{ cells: [[styled("a")], [styled("b")]] }, { cells: [[styled("c")]] }],
          },
        },
      ]),
    );
    expect(warnings).toEqual([]);
    expectValid(blocks);
    expect(blocks[0]).toEqual({
      id: "t",
      type: "table",
      headerRow: true,
      rows: [
        [[{ text: "a" }], [{ text: "b" }]],
        [[{ text: "c" }], []],
      ],
    });
  });

  it("drops external image URLs and warns, but keeps uploaded images", () => {
    const asset: MediaAsset = {
      id: "med_0123456789abcdef",
      width: 1200,
      height: 800,
      widths: [480, 960, 1200],
      bytes: 1000,
      createdAt: new Date().toISOString(),
      usage: { draft: false, versions: [] },
    };
    const { blocks, warnings } = editorToBlocks(
      editor([
        { id: "ext", type: "image", props: { url: "https://cdn.example.com/x.png", caption: "" } },
        {
          id: "own",
          type: "image",
          props: { url: `/api/public/v1/media/${asset.id}/960.webp`, caption: " 설명 " },
        },
      ]),
      { lookupMedia: (id) => (id === asset.id ? asset : undefined) },
    );
    expect(warnings.some((w) => w.includes("외부 이미지"))).toBe(true);
    expectValid(blocks);
    expect(blocks).toEqual([
      {
        id: "own",
        type: "image",
        media: {
          id: "own",
          kind: "image",
          assetId: asset.id,
          alt: "설명",
          width: 1200,
          height: 800,
          widths: [480, 960, 1200],
        },
        caption: "설명",
      },
    ]);
  });

  it("drops the trailing empty paragraph the editor always leaves", () => {
    const { blocks } = editorToBlocks(
      editor([
        { id: "p1", type: "paragraph", content: [styled("text")] },
        { id: "p2", type: "paragraph", content: [] },
        { id: "p3", type: "paragraph", content: [] },
      ]),
    );
    expect(blocks.map((b) => b.id)).toEqual(["p1"]);
  });

  it("warns once about alignment and color settings instead of saving them", () => {
    const { blocks, warnings } = editorToBlocks(
      editor([
        { id: "p1", type: "paragraph", props: { textAlignment: "center" }, content: [styled("a")] },
        { id: "p2", type: "paragraph", props: { textColor: "red" }, content: [styled("b")] },
      ]),
    );
    expect(blocks).toHaveLength(2);
    expect(warnings.filter((w) => w.includes("정렬·색"))).toHaveLength(1);
  });
});

describe("blocksToEditor → editorToBlocks", () => {
  it("round-trips the supported block types without loss", () => {
    const original: Block[] = [
      { id: "h", type: "heading", level: 3, text: [{ text: "H" }] },
      {
        id: "p",
        type: "paragraph",
        text: [
          { text: "a", marks: ["bold", "code"] },
          { text: "b", href: "https://x.test" },
        ],
      },
      {
        id: "l",
        type: "bulleted-list",
        items: [
          { text: [{ text: "1" }], children: [{ text: [{ text: "1-1" }] }] },
          { text: [{ text: "2" }] },
        ],
      },
      { id: "q", type: "quote", text: [{ text: "q" }] },
      { id: "c", type: "callout", tone: "info", text: [{ text: "c" }] },
      { id: "d", type: "divider" },
      {
        id: "t",
        type: "table",
        headerRow: false,
        rows: [
          [[{ text: "a" }], [{ text: "b" }]],
          [[{ text: "c" }], [{ text: "d" }]],
        ],
      },
    ];
    expectValid(original);
    const editorBlocks = blocksToEditor(original);
    const { blocks, warnings } = editorToBlocks(editor(editorBlocks as unknown as Loose[]));
    expect(warnings).toEqual([]);
    expectValid(blocks);
    expect(blocks).toEqual(original);
  });
});
