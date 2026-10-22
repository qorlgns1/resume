import type { ModuleType } from "@resume/contracts";

export interface ModuleCatalogEntry {
  type: ModuleType;
  label: string;
  description: string;
}

/** 어드민의 "추가 가능한 모듈" 목록에 쓰는 메타데이터 */
export const moduleCatalog: readonly ModuleCatalogEntry[] = [
  { type: "intro", label: "자기소개", description: "대표 문구, 소개, 주요 링크 또는 일하는 방식" },
  {
    type: "projects",
    label: "대표 프로젝트",
    description: "개인 프로젝트 1개 강조 또는 1~3개 목록",
  },
  { type: "achievements", label: "성과", description: "문제와 해결, 지표 변화" },
  { type: "tech-stack", label: "기술 스택", description: "분류별 기술 목록" },
  { type: "status", label: "현재 상태", description: "지금 하고 있는 일과 진행 상태" },
  {
    type: "history-entry",
    label: "히스토리 진입부",
    description: "회사 경험 요약과 히스토리 링크",
  },
];

export function getModuleCatalogEntry(type: ModuleType): ModuleCatalogEntry {
  const entry = moduleCatalog.find((item) => item.type === type);
  if (!entry) throw new Error(`Unknown module type: ${type}`);
  return entry;
}
