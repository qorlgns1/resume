import type { ContentLibrary } from "./content";
import type { ModuleInstance } from "./modules";
import type { Page } from "./page";

export interface MissingReference {
  moduleId: string;
  kind: "project" | "company" | "achievement" | "tech-stack";
  id: string;
}

/** 모듈이 참조하는 원본 콘텐츠 ID 목록 */
export function collectModuleReferences(
  module: ModuleInstance,
): Omit<MissingReference, "moduleId">[] {
  switch (module.type) {
    case "projects":
      return module.props.variant === "spotlight"
        ? [{ kind: "project", id: module.props.projectId }]
        : module.props.projectIds.map((id) => ({ kind: "project" as const, id }));
    case "achievements":
      return module.props.achievementIds.map((id) => ({ kind: "achievement" as const, id }));
    case "tech-stack":
      return module.props.groupIds.map((id) => ({ kind: "tech-stack" as const, id }));
    case "intro":
    case "status":
    case "history-entry":
    case "credentials":
      return [];
  }
}

/** 페이지 모듈이 참조하지만 콘텐츠에 없는 항목을 찾는다. */
export function findMissingReferences(page: Page, content: ContentLibrary): MissingReference[] {
  const ids = {
    project: new Set(content.projects.map((p) => p.id)),
    company: new Set(content.companies.map((c) => c.id)),
    achievement: new Set(content.achievements.map((a) => a.id)),
    "tech-stack": new Set(content.techStack.map((g) => g.id)),
  };
  return page.modules.flatMap((module) =>
    collectModuleReferences(module)
      .filter((ref) => !ids[ref.kind].has(ref.id))
      .map((ref) => ({ ...ref, moduleId: module.id })),
  );
}
