import type { SiteDocument } from "@resume/contracts";
import type { z } from "zod";

export type Path = readonly (string | number)[];

export interface Issue {
  path: Path;
  key: string;
  message: string;
}

export function pathKey(path: Path): string {
  return path.join(".");
}

/** 검증 오류를 경로로 찾을 수 있게 정리한다. */
export class IssueIndex {
  readonly list: Issue[];
  private readonly byKey = new Map<string, string[]>();

  constructor(issues: readonly z.core.$ZodIssue[]) {
    this.list = issues.map((issue) => ({
      path: issue.path as Path,
      key: pathKey(issue.path as Path),
      message: issue.message,
    }));
    for (const issue of this.list) {
      this.byKey.set(issue.key, [...(this.byKey.get(issue.key) ?? []), issue.message]);
    }
  }

  get count() {
    return this.list.length;
  }

  /** 정확히 이 경로에 대한 오류 */
  at(path: Path): string | undefined {
    return this.byKey.get(pathKey(path))?.join(" ");
  }

  /** 이 경로와 그 아래의 오류 */
  under(path: Path): Issue[] {
    const prefix = pathKey(path);
    return this.list.filter((issue) => issue.key === prefix || issue.key.startsWith(`${prefix}.`));
  }
}

/** 오류 경로를 사람이 읽을 수 있는 위치 설명으로 바꾼다. */
export function describeIssuePath(document: SiteDocument, path: Path): string {
  const [root, index, child, childIndex] = path;
  if (root === "pages" && typeof index === "number") {
    const page = document.pages[index];
    const where = [`${page?.title ?? "페이지"} 페이지`];
    if (child === "modules" && typeof childIndex === "number") {
      where.push(page?.modules[childIndex]?.label ?? "모듈");
    } else if (child === "layout") {
      where.push("배치");
    }
    return where.join(" › ");
  }
  if (root === "content") {
    const section = index as string;
    const labels: Record<string, string> = {
      profile: "프로필",
      projects: "프로젝트",
      companies: "회사",
      achievements: "성과",
      techStack: "기술 스택",
      history: "히스토리",
    };
    const list = document.content[section as keyof SiteDocument["content"]];
    const item = Array.isArray(list) && typeof child === "number" ? list[child] : undefined;
    const name =
      item && typeof item === "object"
        ? ((item as { title?: string; name?: string; label?: string }).title ??
          (item as { name?: string }).name ??
          (item as { label?: string }).label)
        : undefined;
    return [`콘텐츠 › ${labels[section] ?? section}`, name].filter(Boolean).join(" › ");
  }
  if (root === "site") return "콘텐츠 › 사이트 정보";
  return "문서";
}
