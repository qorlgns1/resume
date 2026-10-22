import { z } from "zod";
import { HrefSchema, IdSchema, MediaSchema } from "./primitives";

/**
 * 프로젝트·회사 상세 본문에 쓸 노션형 블록의 최소 정의.
 * 블록 편집기를 고른 뒤 확장한다. HTML이나 실행 가능한 코드 문자열은 저장하지 않는다.
 */
export const RichTextSpanSchema = z.object({
  text: z.string(),
  marks: z.array(z.enum(["bold", "italic", "code"])).optional(),
  href: HrefSchema.optional(),
});
export const RichTextSchema = z.array(RichTextSpanSchema);
export type RichText = z.infer<typeof RichTextSchema>;

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ id: IdSchema, type: z.literal("paragraph"), text: RichTextSchema }),
  z.object({
    id: IdSchema,
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: RichTextSchema,
  }),
  z.object({ id: IdSchema, type: z.literal("bulleted-list"), items: z.array(RichTextSchema) }),
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
