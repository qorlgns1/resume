import {
  type ContentLibrary,
  DEFAULT_MODULE_STYLE,
  MAX_HOME_PROJECTS,
  type ModuleInstance,
  type ModuleType,
} from "@resume/contracts";

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

/** 브라우저와 서버 모두에서 쓸 수 있는 짧은 안정 ID */
export function createId(prefix: string): string {
  const random = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `${prefix}_${random}`;
}

export type ModuleDraftResult =
  | { ok: true; module: ModuleInstance }
  | { ok: false; reason: string };

/**
 * 새 모듈 인스턴스의 기본값을 만든다.
 * 원본 콘텐츠를 참조해야 하는 모듈은 연결할 콘텐츠가 없으면 만들 수 없다는 이유를 돌려준다.
 */
export function createModuleDraft(type: ModuleType, content: ContentLibrary): ModuleDraftResult {
  const id = createId(`mod_${type.replace("-", "_")}`);
  const label = getModuleCatalogEntry(type).label;
  const style = { ...DEFAULT_MODULE_STYLE };

  switch (type) {
    case "intro":
      return {
        ok: true,
        module: { id, type, label, style, props: { variant: "hero", showName: true, actions: [] } },
      };
    case "projects": {
      const projectIds = content.projects.slice(0, MAX_HOME_PROJECTS).map((p) => p.id);
      if (projectIds.length === 0)
        return { ok: false, reason: "먼저 콘텐츠에서 프로젝트를 추가하세요." };
      return {
        ok: true,
        module: {
          id,
          type,
          label,
          style: { ...style, background: "transparent", padding: "none" },
          props: { variant: "grid", heading: "개인 프로젝트", projectIds },
        },
      };
    }
    case "achievements": {
      const achievementIds = content.achievements.slice(0, 2).map((a) => a.id);
      if (achievementIds.length === 0)
        return { ok: false, reason: "먼저 콘텐츠에서 성과를 추가하세요." };
      return {
        ok: true,
        module: {
          id,
          type,
          label,
          style: { ...style, background: "transparent", padding: "none" },
          props: { heading: "문제를 해결한 경험", achievementIds },
        },
      };
    }
    case "tech-stack": {
      const groupIds = content.techStack.slice(0, 6).map((g) => g.id);
      if (groupIds.length === 0)
        return { ok: false, reason: "먼저 콘텐츠에서 기술 분류를 추가하세요." };
      return {
        ok: true,
        module: { id, type, label, style, props: { heading: "기술 스택", groupIds } },
      };
    }
    case "status":
      return {
        ok: true,
        module: {
          id,
          type,
          label,
          style,
          props: {
            eyebrow: "지금 하고 있는 일",
            title: "제목을 입력하세요",
            description: "",
            items: [],
          },
        },
      };
    case "history-entry": {
      const companyIds = content.companies.slice(0, 4).map((c) => c.id);
      if (companyIds.length === 0)
        return { ok: false, reason: "먼저 콘텐츠에서 회사를 추가하세요." };
      return {
        ok: true,
        module: {
          id,
          type,
          label,
          style,
          props: {
            heading: "지나온 경험",
            companyIds,
            link: { label: "경력과 히스토리 보기", href: "/history" },
          },
        },
      };
    }
  }
}
