import {
  type ContentLibrary,
  DEFAULT_MODULE_STYLE,
  MAX_HOME_PROJECTS,
  type ModuleInstance,
  type ModuleStyle,
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
  { type: "credentials", label: "학력·자격증", description: "학력과 자격증 목록 (최신순)" },
];

/** 형태를 고를 수 있는 모듈과 그 형태 목록 */
export const moduleVariants = {
  intro: [
    { value: "hero", label: "자기소개" },
    { value: "principles", label: "일하는 방식" },
  ],
  projects: [
    { value: "grid", label: "목록 (1~3개)" },
    { value: "spotlight", label: "1개 강조" },
  ],
} as const satisfies Partial<Record<ModuleType, readonly { value: string; label: string }[]>>;

export type VariantModuleType = keyof typeof moduleVariants;

export function hasModuleVariants(type: ModuleType): type is VariantModuleType {
  return type in moduleVariants;
}

/** 목록은 카드 없이 펼쳐 놓고, 1개 강조는 진한 카드로 보여주는 기본 스타일 */
const GRID_STYLE = { background: "transparent", padding: "none" } as const;
const SPOTLIGHT_STYLE = { background: "inverse", padding: "lg" } as const;

/** 스타일이 이전 형태의 기본값 그대로일 때만 새 형태의 기본값으로 바꾼다. 직접 고친 값은 둔다. */
type VariantStyle = Pick<ModuleStyle, "background" | "padding">;

function swapStyle(style: ModuleStyle, from: VariantStyle, to: VariantStyle): ModuleStyle {
  return {
    ...style,
    background: style.background === from.background ? to.background : style.background,
    padding: style.padding === from.padding ? to.padding : style.padding,
  };
}

/**
 * 모듈 형태를 바꾼 props를 만든다.
 * 이어지는 값(프로젝트, 링크)은 옮기고, 나머지는 새 형태의 기본값을 쓴다.
 */
export function convertModuleVariant(
  module: ModuleInstance,
  variant: string,
  content: ContentLibrary,
): ModuleDraftResult {
  if (module.type === "intro") {
    if (variant === module.props.variant) return { ok: true, module };
    if (variant === "principles")
      return { ok: true, module: { ...module, props: { variant: "principles" } } };
    if (variant === "hero")
      return {
        ok: true,
        module: { ...module, props: { variant: "hero", showName: true, actions: [] } },
      };
  }
  if (module.type === "projects") {
    const p = module.props;
    if (variant === p.variant) return { ok: true, module };
    if (variant === "spotlight" && p.variant === "grid") {
      const id = p.projectIds[0] ?? content.projects[0]?.id;
      if (!id) return { ok: false, reason: "먼저 콘텐츠에서 프로젝트를 추가하세요." };
      return {
        ok: true,
        module: {
          ...module,
          style: swapStyle(module.style, GRID_STYLE, SPOTLIGHT_STYLE),
          props: {
            variant: "spotlight",
            eyebrow: "대표 프로젝트",
            projectId: id,
            link: p.viewAll,
          },
        },
      };
    }
    if (variant === "grid" && p.variant === "spotlight") {
      return {
        ok: true,
        module: {
          ...module,
          style: swapStyle(module.style, SPOTLIGHT_STYLE, GRID_STYLE),
          props: {
            variant: "grid",
            heading: "개인 프로젝트",
            projectIds: [p.projectId],
            viewAll: p.link,
          },
        },
      };
    }
  }
  return { ok: false, reason: "이 모듈은 형태를 바꿀 수 없습니다." };
}

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
          style: { ...style, ...GRID_STYLE },
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
      if (content.companies.length === 0)
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
            count: Math.min(content.companies.length, 4),
            link: { label: "경력과 히스토리 보기", href: "/history" },
          },
        },
      };
    }
    case "credentials":
      if (content.education.length === 0 && content.certifications.length === 0)
        return { ok: false, reason: "먼저 콘텐츠에서 학력이나 자격증을 추가하세요." };
      return {
        ok: true,
        module: { id, type, label, style, props: { heading: "학력·자격증" } },
      };
  }
}
