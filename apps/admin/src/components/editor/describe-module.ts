import type { ContentLibrary, ModuleInstance } from "@resume/contracts";

export interface ContentField {
  label: string;
  value: string;
  /** 값이 원본 콘텐츠에서 온 경우 그 출처. 원본을 고치면 모든 페이지에 반영된다. */
  source?: string;
  multiline?: boolean;
}

function titlesOf<T extends { id: string }>(
  ids: readonly string[],
  items: readonly T[],
  pick: (item: T) => string,
) {
  return ids.map((id) => {
    const item = items.find((i) => i.id === id);
    return item ? pick(item) : `(없는 항목: ${id})`;
  });
}

/** 설정 패널의 "콘텐츠" 탭에 보여줄 값. 편집 폼이 생기기 전까지 읽기 전용으로 표시한다. */
export function describeModuleContent(
  module: ModuleInstance,
  content: ContentLibrary,
): ContentField[] {
  switch (module.type) {
    case "intro": {
      if (module.props.variant === "principles") {
        return content.profile.principles.map((p, i) => ({
          label: `원칙 ${i + 1}`,
          value: `${p.title} — ${p.keywords.join(", ")}`,
          source: "프로필",
        }));
      }
      return [
        { label: "직무 (eyebrow)", value: content.profile.roleEyebrow ?? "", source: "프로필" },
        { label: "대표 문구", value: content.profile.headline, source: "프로필", multiline: true },
        { label: "소개", value: content.profile.summary, source: "프로필", multiline: true },
        { label: "이름 표시", value: module.props.showName ? "표시" : "숨김" },
        ...module.props.actions.map((a, i) => ({
          label: `버튼 ${i + 1}`,
          value: `${a.label} → ${a.href}`,
        })),
      ];
    }
    case "projects": {
      if (module.props.variant === "spotlight") {
        return [
          { label: "보조 제목", value: module.props.eyebrow },
          {
            label: "프로젝트",
            value: titlesOf([module.props.projectId], content.projects, (p) => p.title).join(""),
            source: "프로젝트",
          },
          {
            label: "링크",
            value: module.props.link
              ? `${module.props.link.label} → ${module.props.link.href}`
              : "없음",
          },
        ];
      }
      return [
        { label: "제목", value: module.props.heading },
        { label: "설명", value: module.props.description ?? "", multiline: true },
        {
          label: `표시 프로젝트 (${module.props.projectIds.length}/3)`,
          value: titlesOf(module.props.projectIds, content.projects, (p) => p.title).join(", "),
          source: "프로젝트",
        },
        { label: "안내 문구", value: module.props.mediaNote ?? "" },
      ];
    }
    case "achievements":
      return [
        { label: "제목", value: module.props.heading },
        { label: "설명", value: module.props.description ?? "" },
        {
          label: "성과 항목",
          value: titlesOf(module.props.achievementIds, content.achievements, (a) => a.title).join(
            "\n",
          ),
          source: "성과",
          multiline: true,
        },
      ];
    case "tech-stack":
      return [
        { label: "제목", value: module.props.heading },
        {
          label: "기술 분류",
          value: titlesOf(
            module.props.groupIds,
            content.techStack,
            (g) => `${g.label}: ${g.items.join(", ")}`,
          ).join("\n"),
          source: "기술 스택",
          multiline: true,
        },
      ];
    case "status":
      return [
        { label: "보조 제목", value: module.props.eyebrow },
        { label: "제목", value: module.props.title },
        { label: "설명", value: module.props.description, multiline: true },
        { label: "상태 배지", value: module.props.badge?.label ?? "없음" },
        {
          label: "항목",
          value: module.props.items.map((i) => `${i.label} — ${i.description}`).join("\n"),
          multiline: true,
        },
      ];
    case "history-entry":
      return [
        { label: "제목", value: module.props.heading },
        { label: "설명", value: module.props.description ?? "", multiline: true },
        {
          label: "회사",
          value: titlesOf(module.props.companyIds, content.companies, (c) => c.name).join(", "),
          source: "회사 경험",
        },
        { label: "링크", value: `${module.props.link.label} → ${module.props.link.href}` },
      ];
  }
}
