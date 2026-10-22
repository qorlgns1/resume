import type { Page, PageLayout, SystemPageKey } from "../index";
import { DEFAULT_MODULE_STYLE } from "../style";

const emptyLayout: PageLayout = {
  desktop: { columns: 12, items: [] },
  mobile: { columns: 2, strategy: "auto", items: [] },
};

export const sampleHomePage: Page = {
  id: "page_home",
  kind: "system",
  systemKey: "home",
  title: "홈",
  modules: [
    {
      id: "mod_home_intro",
      type: "intro",
      label: "자기소개",
      style: { ...DEFAULT_MODULE_STYLE, padding: "lg" },
      props: {
        variant: "hero",
        showName: true,
        actions: [
          {
            id: "act_projects",
            label: "프로젝트 보기",
            href: "#mod_home_projects",
            emphasis: "primary",
          },
          { id: "act_github", label: "GitHub", href: "https://github.com", emphasis: "secondary" },
          {
            id: "act_contact",
            label: "연락하기",
            href: "mailto:hello@example.com",
            emphasis: "secondary",
          },
        ],
      },
    },
    {
      id: "mod_home_spotlight",
      type: "projects",
      label: "대표 프로젝트",
      style: { ...DEFAULT_MODULE_STYLE, background: "inverse", padding: "lg" },
      props: {
        variant: "spotlight",
        eyebrow: "직접 만든 제품",
        projectId: "prj_timecard",
        link: { id: "lnk_spotlight", label: "프로젝트 보기", href: "/projects" },
      },
    },
    {
      id: "mod_home_principles",
      type: "intro",
      label: "일하는 방식",
      style: { ...DEFAULT_MODULE_STYLE, padding: "md" },
      props: { variant: "principles" },
    },
    {
      id: "mod_home_projects",
      type: "projects",
      label: "개인 프로젝트 목록",
      style: { ...DEFAULT_MODULE_STYLE, background: "transparent", padding: "none" },
      props: {
        variant: "grid",
        heading: "직접 만든 제품",
        description: "작은 문제에서 시작해, 실제로 사용할 수 있는 서비스로.",
        projectIds: ["prj_timecard", "prj_bookmark", "prj_wordbook"],
        viewAll: { id: "lnk_all_projects", label: "전체 프로젝트", href: "/projects" },
        mediaNote: "제품 화면은 디자인 검토용 예시입니다.",
      },
    },
    {
      id: "mod_home_achievements",
      type: "achievements",
      label: "성과",
      style: { ...DEFAULT_MODULE_STYLE, background: "transparent", padding: "none" },
      props: {
        heading: "문제를 해결한 경험",
        description: "팀에서 맡았던 역할과 기술적 판단",
        achievementIds: ["ach_stability", "ach_performance"],
      },
    },
    {
      id: "mod_home_stack",
      type: "tech-stack",
      label: "기술 스택",
      style: DEFAULT_MODULE_STYLE,
      props: {
        heading: "기술 스택",
        groupIds: ["ts_frontend", "ts_mobile", "ts_tooling"],
      },
    },
    {
      id: "mod_home_status",
      type: "status",
      label: "현재 상태",
      style: DEFAULT_MODULE_STYLE,
      props: {
        eyebrow: "오픈소스 프로젝트",
        title: "이 포트폴리오도 하나의 제품입니다.",
        description: "콘텐츠를 직접 관리할 수 있는 포트폴리오를 만들고 있습니다.",
        badge: { label: "설계 중", tone: "neutral" },
        items: [
          { id: "st_intro", label: "소개", description: "소개글, 프로필 이미지를 관리합니다." },
          {
            id: "st_projects",
            label: "프로젝트",
            description: "프로젝트 정보를 추가하고 수정합니다.",
          },
          { id: "st_history", label: "히스토리", description: "경력과 경험을 관리합니다." },
        ],
      },
    },
    {
      id: "mod_home_history",
      type: "history-entry",
      label: "히스토리 진입부",
      style: DEFAULT_MODULE_STYLE,
      props: {
        heading: "지나온 경험",
        description: "회사에서의 경험과 개인 작업의 흐름을 함께 기록합니다.",
        companyIds: ["co_a", "co_b", "co_c", "co_d"],
        link: { label: "경력과 히스토리 보기", href: "/history" },
      },
    },
  ],
  layout: {
    desktop: {
      columns: 12,
      items: [
        { moduleId: "mod_home_intro", col: 1, colSpan: 7, row: 1, rowSpan: 1 },
        { moduleId: "mod_home_spotlight", col: 8, colSpan: 5, row: 1, rowSpan: 1 },
        { moduleId: "mod_home_principles", col: 1, colSpan: 12, row: 2, rowSpan: 1 },
        { moduleId: "mod_home_projects", col: 1, colSpan: 12, row: 3, rowSpan: 1 },
        { moduleId: "mod_home_achievements", col: 1, colSpan: 12, row: 4, rowSpan: 1 },
        { moduleId: "mod_home_stack", col: 1, colSpan: 4, row: 5, rowSpan: 1 },
        { moduleId: "mod_home_status", col: 5, colSpan: 8, row: 5, rowSpan: 1 },
        { moduleId: "mod_home_history", col: 1, colSpan: 12, row: 6, rowSpan: 1 },
      ],
    },
    mobile: {
      columns: 2,
      strategy: "auto",
      items: [
        // 모바일에서만 여백을 줄이는 화면별 스타일 덮어쓰기 예시
        { moduleId: "mod_home_intro", style: { padding: "md" } },
        { moduleId: "mod_home_spotlight", style: { padding: "md" } },
      ],
    },
  },
};

function systemPage(
  systemKey: Exclude<SystemPageKey, "home">,
  title: string,
  description: string,
): Page {
  return {
    id: `page_${systemKey}`,
    kind: "system",
    systemKey,
    title,
    description,
    modules: [],
    layout: emptyLayout,
  };
}

export const samplePages: Page[] = [
  sampleHomePage,
  systemPage("projects", "개인 프로젝트", "직접 기획하고 만든 프로젝트 목록입니다."),
  systemPage("experience", "회사 경험", "회사별 역할과 경험을 정리합니다."),
  systemPage("history", "히스토리", "챕터와 타임라인으로 지나온 경험을 기록합니다."),
];
