import { z } from "zod";
import { HrefSchema, IdSchema, MediaSchema } from "./primitives";

/**
 * 프로젝트·회사 상세 본문에 쓸 노션형 블록.
 * 편집기(어드민의 BlockNote)와 무관한 저장 형식이며, HTML이나 실행 가능한 코드 문자열은 저장하지 않는다.
 */
export const RichTextSpanSchema = z.object({
  text: z.string(),
  marks: z.array(z.enum(["bold", "italic", "code"])).optional(),
  href: HrefSchema.optional(),
});
export const RichTextSchema = z.array(RichTextSpanSchema);
export type RichText = z.infer<typeof RichTextSchema>;

/** 목록 중첩 최대 깊이 (최상위 = 1) */
export const MAX_LIST_DEPTH = 3;

export interface ListItem {
  text: RichText;
  children?: ListItem[];
}

const ListItemObjectSchema: z.ZodType<ListItem> = z.lazy(() =>
  z.object({
    text: RichTextSchema,
    children: z.array(ListItemSchema).optional(),
  }),
);

/** 목록 항목. 예전 형식(RichText 배열만 있는 항목)도 읽어서 { text }로 바꾼다. */
export const ListItemSchema: z.ZodType<ListItem> = z.preprocess(
  (value) => (Array.isArray(value) ? { text: value } : value),
  ListItemObjectSchema,
) as z.ZodType<ListItem>;

function listDepth(items: readonly ListItem[]): number {
  return items.reduce((max, item) => Math.max(max, 1 + listDepth(item.children ?? [])), 0);
}

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ id: IdSchema, type: z.literal("paragraph"), text: RichTextSchema }),
  z.object({
    id: IdSchema,
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: RichTextSchema,
  }),
  z
    .object({
      id: IdSchema,
      type: z.literal("bulleted-list"),
      items: z.array(ListItemSchema).min(1),
    })
    .refine((block) => listDepth(block.items) <= MAX_LIST_DEPTH, {
      message: `목록은 ${MAX_LIST_DEPTH}단계까지 들여쓸 수 있습니다.`,
      path: ["items"],
    }),
  z.object({ id: IdSchema, type: z.literal("quote"), text: RichTextSchema }),
  z.object({
    id: IdSchema,
    type: z.literal("callout"),
    tone: z.enum(["info", "warning"]),
    text: RichTextSchema,
  }),
  z.object({
    id: IdSchema,
    type: z.literal("image"),
    media: MediaSchema,
    caption: z.string().optional(),
  }),
  z.object({ id: IdSchema, type: z.literal("divider") }),
]);
export type Block = z.infer<typeof BlockSchema>;
