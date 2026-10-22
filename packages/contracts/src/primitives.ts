import { z } from "zod";

/**
 * 안정적인 엔터티 ID. 사람이 읽을 수 있는 접두사를 권장한다(예: "mod_intro_hero").
 * 저장 계층이 정해지면 생성 규칙(nanoid, uuid 등)을 확정한다.
 */
export const IdSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/, "영문·숫자·_·- 로 된 1~64자 ID여야 합니다.");
export type Id = z.infer<typeof IdSchema>;

/** URL 경로 조각. 소문자·숫자·하이픈만 허용한다. */
export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "소문자·숫자·하이픈으로 된 slug여야 합니다.");

/** 연-월 날짜. 실행 가능한 문자열이 아닌 ISO 형식의 데이터로만 저장한다. */
export const YearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM 형식이어야 합니다.");
export type YearMonth = z.infer<typeof YearMonthSchema>;

export const PeriodSchema = z
  .object({
    start: YearMonthSchema,
    /** null이면 진행 중 */
    end: YearMonthSchema.nullable(),
  })
  .refine((p) => p.end === null || p.end >= p.start, {
    message: "종료일은 시작일보다 빠를 수 없습니다.",
    path: ["end"],
  });
export type Period = z.infer<typeof PeriodSchema>;

/**
 * 허용하는 링크 형식: 내부 경로(/), 앵커(#), http(s), mailto.
 * javascript: 등 실행 가능한 스킴은 거부한다.
 */
export const HrefSchema = z
  .string()
  .min(1)
  .refine((v) => /^(\/(?!\/)|#|https?:\/\/|mailto:)/.test(v), {
    message: "링크는 /, #, http(s)://, mailto: 로 시작해야 합니다.",
  });

export const LinkSchema = z.object({
  id: IdSchema,
  label: z.string().min(1).max(40),
  href: HrefSchema,
});
export type Link = z.infer<typeof LinkSchema>;

/**
 * 이미지·미디어 참조. 업로드와 저장소는 아직 정하지 않았으므로
 * 샘플에서는 실제 이미지 대신 placeholder를 사용한다.
 */
export const MediaSchema = z.discriminatedUnion("kind", [
  z.object({
    id: IdSchema,
    kind: z.literal("placeholder"),
    /** 화면에 표시할 안내 문구 (예: "예시 화면") */
    label: z.string().min(1).max(40),
    alt: z.string(),
  }),
  z.object({
    id: IdSchema,
    kind: z.literal("image"),
    src: HrefSchema,
    alt: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
]);
export type Media = z.infer<typeof MediaSchema>;

/** 샘플 콘텐츠 표시 플래그. 화면에서 "샘플" 표기를 붙이는 데 사용한다. */
export const SampleFlagSchema = z.boolean().optional();
