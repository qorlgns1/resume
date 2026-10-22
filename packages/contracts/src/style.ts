import { z } from "zod";

/**
 * 모듈 단위 스타일. 임의 CSS 대신 디자인 토큰에 대응하는 제한된 선택지만 저장한다.
 * 전체 테마는 고정이고, 개별 모듈의 배경·글자 크기·정렬·여백·테두리만 조정한다.
 */
export const ModuleBackgroundSchema = z.enum([
  "surface", // 흰 카드
  "muted", // 옅은 회색 카드
  "inverse", // 어두운 카드
  "primary-soft", // 옅은 강조색 카드
  "transparent", // 카드 없이 페이지 배경 위에 표시
]);
export const ModuleTextScaleSchema = z.enum(["sm", "md", "lg"]);
export const ModuleAlignSchema = z.enum(["start", "center"]);
export const ModulePaddingSchema = z.enum(["none", "sm", "md", "lg"]);
export const ModuleBorderSchema = z.enum(["none", "subtle", "strong"]);

export const ModuleStyleSchema = z.object({
  background: ModuleBackgroundSchema,
  textScale: ModuleTextScaleSchema,
  align: ModuleAlignSchema,
  padding: ModulePaddingSchema,
  border: ModuleBorderSchema,
});
export type ModuleStyle = z.infer<typeof ModuleStyleSchema>;

/** 모바일 등 화면별로 일부 속성만 덮어쓸 때 사용한다. */
export const ModuleStyleOverrideSchema = ModuleStyleSchema.partial();
export type ModuleStyleOverride = z.infer<typeof ModuleStyleOverrideSchema>;

export const DEFAULT_MODULE_STYLE: ModuleStyle = {
  background: "surface",
  textScale: "md",
  align: "start",
  padding: "md",
  border: "none",
};
