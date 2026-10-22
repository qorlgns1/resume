/**
 * 토큰 메타데이터. Storybook 문서와 대비 검사에서 사용한다.
 * 실제 값의 원천은 tokens.css이며, 여기의 hex 값은 그와 동일하게 유지한다.
 */

export interface ColorToken {
  /** CSS 변수 이름 */
  readonly cssVar: `--rs-${string}`;
  /** Tailwind 유틸리티에서 쓰는 색상 이름 (bg-<name>, text-<name>) */
  readonly utility?: string;
  readonly value: string;
  readonly description: string;
}

export const semanticColors = [
  { cssVar: "--rs-color-canvas", utility: "canvas", value: "#f2f3f5", description: "페이지 배경" },
  { cssVar: "--rs-color-surface", utility: "card", value: "#ffffff", description: "기본 카드" },
  {
    cssVar: "--rs-color-surface-muted",
    utility: "muted",
    value: "#f8f9fa",
    description: "카드 안의 보조 영역",
  },
  {
    cssVar: "--rs-color-surface-sunken",
    utility: "secondary",
    value: "#eaecef",
    description: "보조 버튼·hover 배경",
  },
  {
    cssVar: "--rs-color-surface-inverse",
    utility: "inverse",
    value: "#1c1d21",
    description: "어두운 카드",
  },
  {
    cssVar: "--rs-color-text",
    utility: "foreground",
    value: "#111214",
    description: "본문 텍스트",
  },
  {
    cssVar: "--rs-color-text-muted",
    utility: "muted-foreground",
    value: "#4b5260",
    description: "보조 텍스트",
  },
  {
    cssVar: "--rs-color-text-subtle",
    utility: "subtle-foreground",
    value: "#636a76",
    description: "캡션·메타 정보",
  },
  {
    cssVar: "--rs-color-text-inverse-muted",
    utility: "inverse-muted",
    value: "#b8bcc5",
    description: "어두운 카드의 보조 텍스트",
  },
  {
    cssVar: "--rs-color-primary",
    utility: "primary",
    value: "#2f6bff",
    description: "강조색 — 버튼 배경, 큰 텍스트",
  },
  {
    cssVar: "--rs-color-primary-text",
    utility: "primary-text",
    value: "#1f58e6",
    description: "작은 링크 텍스트",
  },
  {
    cssVar: "--rs-color-primary-soft",
    utility: "primary-soft",
    value: "#eef3ff",
    description: "강조 배지 배경",
  },
  { cssVar: "--rs-color-border", utility: "border", value: "#e1e4e8", description: "기본 경계선" },
  {
    cssVar: "--rs-color-input",
    utility: "input",
    value: "#868d98",
    description: "입력 필드 경계선",
  },
  {
    cssVar: "--rs-color-danger",
    utility: "destructive",
    value: "#d0312d",
    description: "오류·삭제",
  },
  { cssVar: "--rs-color-success", utility: "success", value: "#067647", description: "성공" },
  { cssVar: "--rs-color-warning", utility: "warning", value: "#a15c07", description: "주의" },
] as const satisfies readonly ColorToken[];

export interface TypeToken {
  readonly name: string;
  readonly utility: string;
  readonly size: string;
  readonly lineHeight: number;
  readonly usage: string;
}

export const typeScale = [
  {
    name: "display",
    utility: "text-display",
    size: "56px",
    lineHeight: 1.14,
    usage: "홈 대표 문구",
  },
  {
    name: "display-sm",
    utility: "text-display-sm",
    size: "36px",
    lineHeight: 1.2,
    usage: "모바일 대표 문구, 카드 제목",
  },
  { name: "heading", utility: "text-heading", size: "26px", lineHeight: 1.3, usage: "섹션 제목" },
  { name: "title", utility: "text-title", size: "20px", lineHeight: 1.4, usage: "카드 제목" },
  { name: "body-lg", utility: "text-body-lg", size: "18px", lineHeight: 1.6, usage: "소개 문단" },
  { name: "body", utility: "text-body", size: "16px", lineHeight: 1.65, usage: "본문" },
  { name: "body-sm", utility: "text-body-sm", size: "14px", lineHeight: 1.6, usage: "보조 본문" },
  { name: "caption", utility: "text-caption", size: "12px", lineHeight: 1.5, usage: "메타 정보" },
] as const satisfies readonly TypeToken[];

export const radii = [
  { cssVar: "--rs-radius-xs", utility: "rounded-xs", value: "4px" },
  { cssVar: "--rs-radius-sm", utility: "rounded-sm", value: "6px" },
  { cssVar: "--rs-radius-md", utility: "rounded-md", value: "10px" },
  { cssVar: "--rs-radius-lg", utility: "rounded-lg", value: "14px" },
  { cssVar: "--rs-radius-xl", utility: "rounded-xl", value: "18px" },
] as const;

export const spacing = [
  { cssVar: "--rs-layout-gutter", value: "16px", usage: "모바일 좌우 여백" },
  { cssVar: "--rs-layout-gutter-lg", value: "40px", usage: "데스크톱 좌우 여백" },
  { cssVar: "--rs-layout-max-width", value: "1280px", usage: "콘텐츠 최대 너비" },
  { cssVar: "--rs-bento-gap", value: "12px", usage: "모바일 카드 간격" },
  { cssVar: "--rs-bento-gap-lg", value: "16px", usage: "데스크톱 카드 간격" },
  { cssVar: "--rs-card-padding-sm", value: "16px", usage: "카드 안쪽 여백 sm" },
  { cssVar: "--rs-card-padding-md", value: "24px", usage: "카드 안쪽 여백 md" },
  { cssVar: "--rs-card-padding-lg", value: "32px", usage: "카드 안쪽 여백 lg" },
] as const;
