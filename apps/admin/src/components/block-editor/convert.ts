import {
  ADMIN_MEDIA_BASE,
  type Block,
  type ListItem,
  MAX_LIST_DEPTH,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  type MediaAsset,
  mediaUrl,
  type RichText,
} from "@resume/contracts";
import type { EditorBlock, EditorPartialBlock } from "./schema";

/*
 * BlockNote 문서 ↔ 저장 형식(@resume/contracts Block[]) 변환.
 * 저장 형식이 기준이며, 편집기는 언제든 바꿀 수 있도록 이 파일에만 의존을 모은다.
 */

type InlineContent = EditorBlock extends { content: infer C }
  ? C extends unknown[]
    ? C[number]
    : never
  : never;
type StyledText = {
  type: "text";
  text: string;
  styles: { bold?: true; italic?: true; code?: true };
};

export interface ConversionResult {
  blocks: Block[];
  /** 저장 형식으로 옮기면서 사라지는 정보 */
  warnings: string[];
}

function toRichText(content: unknown): RichText {
  if (!Array.isArray(content)) return [];
  const spans: RichText = [];
  const pushText = (item: StyledText, href?: string) => {
    if (!item.text) return;
    const marks = (["bold", "italic", "code"] as const).filter((m) => item.styles?.[m]);
    spans.push({ text: item.text, ...(marks.length ? { marks } : {}), ...(href ? { href } : {}) });
  };
  for (const item of content as (
    | InlineContent
    | StyledText
    | { type: "link"; href: string; content: StyledText[] }
  )[]) {
    if (!item || typeof item !== "object") continue;
    if ((item as StyledText).type === "text") pushText(item as StyledText);
    else if ((item as { type: string }).type === "link") {
      const link = item as { href: string; content: StyledText[] };
      for (const child of link.content) pushText(child, link.href);
    }
  }
  return spans;
}

function fromRichText(text: RichText): StyledText[] | unknown[] {
  return text.map((span) => {
    const styles = Object.fromEntries((span.marks ?? []).map((m) => [m, true]));
    const styled = { type: "text", text: span.text, styles };
    return span.href ? { type: "link", href: span.href, content: [styled] } : styled;
  });
}

function hasNonDefaultProps(block: EditorBlock): boolean {
  const props = block.props as Record<string, unknown>;
  return (
    (props.textAlignment !== undefined && props.textAlignment !== "left") ||
    (props.textColor !== undefined && props.textColor !== "default") ||
    (props.backgroundColor !== undefined && props.backgroundColor !== "default")
  );
}

type EditorTableContent = Extract<EditorBlock, { type: "table" }>["content"];

/** 편집기의 표 칸을 서식 텍스트로. 칸은 서식 텍스트 배열이거나 tableCell 객체다. */
function tableCellText(cell: unknown, warn: (message: string) => void): RichText {
  if (Array.isArray(cell)) return toRichText(cell);
  const { props, content } = cell as { props: Record<string, unknown>; content: unknown };
  if (
    (props.colspan ?? 1) !== 1 ||
    (props.rowspan ?? 1) !== 1 ||
    (props.textAlignment !== undefined && props.textAlignment !== "left") ||
    (props.textColor !== undefined && props.textColor !== "default") ||
    (props.backgroundColor !== undefined && props.backgroundColor !== "default")
  ) {
    warn("표 칸의 병합·정렬·색 설정은 저장되지 않습니다.");
  }
  return toRichText(content);
}

function tableRows(content: EditorTableContent, warn: (message: string) => void): RichText[][] {
  let rows = content.rows.map((row) =>
    (row.cells as unknown[]).map((cell) => tableCellText(cell, warn)),
  );
  if (rows.length > MAX_TABLE_ROWS) {
    warn(`표는 ${MAX_TABLE_ROWS}행까지 저장됩니다.`);
    rows = rows.slice(0, MAX_TABLE_ROWS);
  }
  const columns = Math.max(...rows.map((row) => row.length));
  if (columns > MAX_TABLE_COLUMNS) warn(`표는 ${MAX_TABLE_COLUMNS}열까지 저장됩니다.`);
  const width = Math.min(columns, MAX_TABLE_COLUMNS);
  // 칸 수가 다른 행은 빈 칸으로 채워 모든 행을 같은 너비로 맞춘다.
  return rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? []));
}

/** 편집기의 이미지 주소에서 업로드 이미지 ID를 꺼낸다. 우리 미디어 주소가 아니면 null */
function assetIdFromUrl(url: string): string | null {
  const match = /\/api\/public\/v1\/media\/(med_[a-f0-9]{16})\/\d+\.webp$/.exec(url);
  return match?.[1] ?? null;
}

export interface ConversionOptions {
  /** 업로드 이미지 정보 (크기·변환본 너비). 이미지 블록을 저장 형식으로 바꿀 때 필요하다. */
  lookupMedia?: (assetId: string) => MediaAsset | undefined;
}

export function editorToBlocks(
  editorBlocks: readonly EditorBlock[],
  { lookupMedia }: ConversionOptions = {},
): ConversionResult {
  const blocks: Block[] = [];
  const warnings = new Set<string>();

  /** 목록 항목 하나와 그 하위 목록. 목록이 아닌 하위 블록은 hoisted로 빼낸다. */
  const toListItem = (block: EditorBlock, depth: number, hoisted: EditorBlock[]): ListItem[] => {
    const item: ListItem = { text: toRichText(block.content) };
    const siblings: ListItem[] = [];
    const childItems: ListItem[] = [];
    for (const child of block.children as EditorBlock[]) {
      if (child.type !== "bulletListItem") {
        warnings.add("목록 안에 넣은 다른 블록은 목록 바로 뒤로 옮겨 저장됩니다.");
        hoisted.push(child);
        continue;
      }
      if (depth >= MAX_LIST_DEPTH) {
        warnings.add(
          `목록은 ${MAX_LIST_DEPTH}단계까지 저장됩니다. 더 깊은 항목은 ${MAX_LIST_DEPTH}단계로 저장됩니다.`,
        );
        siblings.push(...toListItem(child, depth, hoisted));
      } else {
        childItems.push(...toListItem(child, depth + 1, hoisted));
      }
    }
    if (childItems.length > 0) item.children = childItems;
    return [item, ...siblings];
  };

  const visit = (list: readonly EditorBlock[]) => {
    for (const block of list) {
      if (hasNonDefaultProps(block)) warnings.add("정렬·색 설정은 저장되지 않습니다.");
      const hoisted: EditorBlock[] = [];
      switch (block.type) {
        case "paragraph":
          blocks.push({ id: block.id, type: "paragraph", text: toRichText(block.content) });
          break;
        case "heading":
          blocks.push({
            id: block.id,
            type: "heading",
            level: block.props.level === 3 ? 3 : 2,
            text: toRichText(block.content),
          });
          break;
        case "bulletListItem": {
          const items = toListItem(block, 1, hoisted);
          const last = blocks.at(-1);
          if (last?.type === "bulleted-list" && hoisted.length === 0) last.items.push(...items);
          else blocks.push({ id: block.id, type: "bulleted-list", items });
          break;
        }
        case "quote":
          blocks.push({ id: block.id, type: "quote", text: toRichText(block.content) });
          break;
        case "divider":
          blocks.push({ id: block.id, type: "divider" });
          break;
        case "callout":
          blocks.push({
            id: block.id,
            type: "callout",
            tone: block.props.tone === "warning" ? "warning" : "info",
            text: toRichText(block.content),
          });
          break;
        case "table": {
          const warn = (message: string) => warnings.add(message);
          if ((block.content.headerCols ?? 0) > 0)
            warn("머리글 열은 저장되지 않습니다. 머리글은 첫 행에만 쓸 수 있습니다.");
          const rows = tableRows(block.content, warn);
          if (rows.length === 0 || rows[0]?.length === 0) break;
          blocks.push({
            id: block.id,
            type: "table",
            headerRow: (block.content.headerRows ?? 0) > 0,
            rows,
          });
          break;
        }
        case "image": {
          const url = block.props.url;
          if (!url) break; // 아직 이미지를 고르지 않은 빈 블록
          const assetId = assetIdFromUrl(url);
          const asset = assetId ? lookupMedia?.(assetId) : undefined;
          if (!asset) {
            warnings.add(
              "외부 이미지 주소는 저장되지 않습니다. 이미지 블록에서 파일을 올려 주세요.",
            );
            break;
          }
          const caption = block.props.caption.trim();
          if (!caption)
            warnings.add(
              "캡션이 없는 이미지는 대체 텍스트 없이 저장됩니다. 캡션에 이미지 설명을 적어 주세요.",
            );
          blocks.push({
            id: block.id,
            type: "image",
            media: {
              id: block.id,
              kind: "image",
              assetId: asset.id,
              alt: caption.slice(0, 200),
              width: asset.width,
              height: asset.height,
              widths: asset.widths,
            },
            ...(caption ? { caption } : {}),
          });
          break;
        }
      }
      if (block.type !== "bulletListItem" && block.children.length > 0) {
        warnings.add(
          "들여쓴 블록은 들여쓰기 없이 저장됩니다. 들여쓰기는 목록에서만 쓸 수 있습니다.",
        );
        hoisted.push(...(block.children as EditorBlock[]));
      }
      if (hoisted.length > 0) visit(hoisted);
    }
  };
  visit(editorBlocks);

  // 편집기가 항상 끝에 두는 빈 문단은 저장하지 않는다.
  while (
    blocks.at(-1)?.type === "paragraph" &&
    (blocks.at(-1) as { text: RichText }).text.length === 0
  ) {
    blocks.pop();
  }
  return { blocks, warnings: [...warnings] };
}

function listItemsToEditor(items: readonly ListItem[], idPrefix: string): EditorPartialBlock[] {
  return items.map(
    (item, index) =>
      ({
        id: index === 0 && !idPrefix.includes("~") ? idPrefix : `${idPrefix}~${index}`,
        type: "bulletListItem",
        content: fromRichText(item.text),
        children: item.children ? listItemsToEditor(item.children, `${idPrefix}~${index}`) : [],
      }) as EditorPartialBlock,
  );
}

export function blocksToEditor(blocks: readonly Block[]): EditorPartialBlock[] {
  const result: EditorPartialBlock[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        result.push({
          id: block.id,
          type: "paragraph",
          content: fromRichText(block.text),
        } as EditorPartialBlock);
        break;
      case "heading":
        result.push({
          id: block.id,
          type: "heading",
          props: { level: block.level },
          content: fromRichText(block.text),
        } as EditorPartialBlock);
        break;
      case "bulleted-list":
        result.push(...listItemsToEditor(block.items, block.id));
        break;
      case "quote":
        result.push({
          id: block.id,
          type: "quote",
          content: fromRichText(block.text),
        } as EditorPartialBlock);
        break;
      case "callout":
        result.push({
          id: block.id,
          type: "callout",
          props: { tone: block.tone },
          content: fromRichText(block.text),
        } as EditorPartialBlock);
        break;
      case "divider":
        result.push({ id: block.id, type: "divider" } as EditorPartialBlock);
        break;
      case "table":
        result.push({
          id: block.id,
          type: "table",
          content: {
            type: "tableContent",
            headerRows: block.headerRow ? 1 : undefined,
            rows: block.rows.map((row) => ({ cells: row.map((cell) => fromRichText(cell)) })),
          },
        } as EditorPartialBlock);
        break;
      case "image":
        if (block.media.kind !== "image") break;
        result.push({
          id: block.id,
          type: "image",
          props: {
            url: mediaUrl(
              ADMIN_MEDIA_BASE,
              block.media.assetId,
              block.media.widths.at(-1) ?? block.media.width,
            ),
            caption: block.caption ?? block.media.alt,
          },
        } as EditorPartialBlock);
        break;
    }
  }
  return result;
}
