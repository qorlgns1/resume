import {
  type Achievement,
  type Company,
  collectModuleReferences,
  type HistoryChapter,
  type Project,
  type SiteDocument,
  type TechStackGroup,
} from "@resume/contracts";
import { createId } from "@resume/modules";
import type { ContentSection } from "../editor-context";

/*
 * 원본 콘텐츠 편집의 순수 로직: 구역 이름, 새 항목 기본값, 사용처 찾기.
 * 화면 코드(content/*.tsx)와 사이드바가 함께 쓰며, React에 의존하지 않는다.
 */

export const contentSectionLabels: Record<ContentSection, string> = {
  site: "사이트 정보",
  profile: "프로필",
  projects: "프로젝트",
  companies: "회사",
  achievements: "성과",
  techStack: "기술 스택",
  history: "히스토리",
  credentials: "학력·자격증",
  media: "미디어",
};

/** 항목을 추가·삭제할 수 있는 목록형 구역 */
export type ListSection = "projects" | "companies" | "achievements" | "techStack";

/** 이 콘텐츠를 쓰는 곳. 쓰는 곳이 있으면 삭제를 막는다. */
export function findContentUsages(
  document: SiteDocument,
  section: ListSection,
  id: string,
): string[] {
  const kind = {
    projects: "project",
    companies: "company",
    achievements: "achievement",
    techStack: "tech-stack",
  }[section];
  const usages: string[] = [];
  for (const page of document.pages) {
    for (const module of page.modules) {
      if (collectModuleReferences(module).some((ref) => ref.kind === kind && ref.id === id)) {
        usages.push(`${page.title} 페이지의 "${module.label}" 모듈`);
      }
    }
  }
  for (const achievement of document.content.achievements) {
    if (achievement.companyId === id || achievement.projectId === id)
      usages.push(`성과 "${achievement.title}"`);
  }
  for (const chapter of document.content.history.chapters) {
    for (const entry of chapter.entries) {
      if (entry.ref?.id === id) usages.push(`히스토리 "${chapter.title}"의 "${entry.title}"`);
    }
  }
  return usages;
}

/** 이미 쓰는 slug와 겹치지 않는 이름. 겹치면 -2, -3을 붙인다. */
export function uniqueSlug(base: string, taken: readonly string[]): string {
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** 이번 달 (YYYY-MM). 새 기간·날짜의 기본값 */
export function currentYearMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 새 원본 콘텐츠 항목의 기본값 */
export function createContentItem(
  section: ListSection,
  document: SiteDocument,
): { id: string; item: unknown } {
  switch (section) {
    case "projects": {
      const id = createId("prj");
      const project: Project = {
        id,
        slug: uniqueSlug(
          "new-project",
          document.content.projects.map((p) => p.slug),
        ),
        kind: "personal",
        title: "새 프로젝트",
        tagline: "",
        summary: "",
        status: "in-development",
        icon: "code",
        tone: "slate",
        tags: [],
        links: [],
        body: [],
      };
      return { id, item: project };
    }
    case "companies": {
      const id = createId("co");
      const company: Company = {
        id,
        slug: uniqueSlug(
          "new-company",
          document.content.companies.map((c) => c.slug),
        ),
        name: "새 회사",
        role: "",
        period: { start: currentYearMonth(), end: null },
        summary: "",
        tags: [],
        body: [],
      };
      return { id, item: company };
    }
    case "achievements": {
      const id = createId("ach");
      const achievement: Achievement = { id, context: [], title: "새 성과", description: "" };
      return { id, item: achievement };
    }
    case "techStack": {
      const id = createId("ts");
      const group: TechStackGroup = { id, label: "새 분류", items: ["기술"] };
      return { id, item: group };
    }
  }
}

/** 이번 달에 시작하는 빈 챕터 */
export function newHistoryChapter(): HistoryChapter {
  return {
    id: createId("ch"),
    title: "새 챕터",
    summary: "",
    period: { start: currentYearMonth(), end: null },
    entries: [],
  };
}
