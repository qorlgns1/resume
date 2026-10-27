import type { Period, ProjectStatus, YearMonth } from "@resume/contracts";

export function formatYearMonth(value: YearMonth): string {
  return value.replace("-", ".");
}

export function formatPeriod(period: Period): string {
  return `${formatYearMonth(period.start)} – ${period.end ? formatYearMonth(period.end) : "현재"}`;
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  live: "운영 중",
  "in-development": "개발 중",
  paused: "일시 중단",
  archived: "종료",
};

/** 이름의 첫 글자. 머리글의 모노그램에 쓴다. 영문은 대문자로 바꾼다. */
export function monogram(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "";
}
