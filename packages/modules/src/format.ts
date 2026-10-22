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
