import type { ContentLibrary, SiteSettings } from "../index";

/*
 * 샘플 콘텐츠.
 * 모든 인물·회사·프로젝트·수치는 가상의 예시이며 실제 경력이나 성과가 아니다.
 * 설치한 사용자는 어드민에서 자신의 콘텐츠로 교체한다(편집 기능은 다음 단계).
 */

export const sampleSite: SiteSettings = {
  title: "홍길동 포트폴리오 (샘플)",
  description:
    "직접 만들고 운영하며 사용자의 문제를 해결하는 프론트엔드 개발자의 샘플 포트폴리오입니다.",
  navigation: [
    { id: "nav_home", label: "홈", href: "/" },
    { id: "nav_projects", label: "개인 프로젝트", href: "/projects" },
    { id: "nav_experience", label: "회사 경험", href: "/experience" },
    { id: "nav_history", label: "히스토리", href: "/history" },
  ],
  footer: {
    links: [
      { id: "foot_github", label: "GitHub", href: "https://github.com" },
      { id: "foot_contact", label: "연락하기", href: "mailto:hello@example.com" },
    ],
    note: "인물·회사·프로젝트·수치는 모두 샘플입니다.",
  },
};

export const sampleContent: ContentLibrary = {
  profile: {
    name: "홍길동",
    role: "프론트엔드 개발자",
    roleEyebrow: "FRONTEND DEVELOPER",
    headline: "아이디어를 제품으로,\n출시 이후의 개선까지.",
    summary: "직접 만들고 운영하며, 사용자의 문제를 해결합니다.",
    principles: [
      { id: "pr_plan", title: "직접 기획하고", keywords: ["문제 정의", "기능 설계"] },
      { id: "pr_build", title: "끝까지 만들고", keywords: ["프론트엔드", "배포"] },
      { id: "pr_improve", title: "출시 후 개선합니다", keywords: ["운영", "피드백 반영"] },
    ],
    isSample: true,
  },
  projects: [
    {
      id: "prj_timecard",
      slug: "timecard",
      kind: "personal",
      title: "타임카드",
      tagline: "일한 시간을 한눈에 기록하는 앱",
      summary: "근무 시작과 종료를 기록하고 주간 근무 시간을 확인하는 샘플 프로젝트입니다.",
      status: "live",
      icon: "clock",
      tone: "blue",
      tags: ["iOS", "1인 개발", "출시"],
      period: { start: "2024-03", end: null },
      cover: {
        id: "media_timecard",
        kind: "placeholder",
        label: "예시 화면",
        alt: "타임카드 앱 예시 화면 자리",
      },
      links: [],
      body: [],
      isSample: true,
    },
    {
      id: "prj_bookmark",
      slug: "bookmark",
      kind: "personal",
      title: "책갈피",
      tagline: "읽은 문장을 모아 두는 독서 기록",
      summary: "인상 깊은 문장을 저장하고 태그로 다시 찾는 샘플 웹 서비스입니다.",
      status: "live",
      icon: "pen",
      tone: "violet",
      tags: ["웹 서비스", "개발", "운영"],
      period: { start: "2023-06", end: null },
      cover: {
        id: "media_bookmark",
        kind: "placeholder",
        label: "예시 화면",
        alt: "책갈피 서비스 예시 화면 자리",
      },
      links: [],
      body: [],
      isSample: true,
    },
    {
      id: "prj_wordbook",
      slug: "wordbook",
      kind: "personal",
      title: "단어장",
      tagline: "반복 학습으로 기억하는 영단어",
      summary: "간격 반복 방식으로 단어를 복습하는 샘플 모바일 앱입니다.",
      status: "in-development",
      icon: "leaf",
      tone: "green",
      tags: ["React Native", "Expo"],
      period: { start: "2025-01", end: null },
      cover: {
        id: "media_wordbook",
        kind: "placeholder",
        label: "예시 화면",
        alt: "단어장 앱 예시 화면 자리",
      },
      links: [],
      body: [],
      isSample: true,
    },
  ],
  companies: [
    {
      id: "co_a",
      slug: "company-a",
      name: "샘플 회사 A",
      role: "프론트엔드 개발",
      period: { start: "2019-03", end: "2020-12" },
      summary: "사내 업무 시스템",
      tags: ["업무 도구"],
      body: [],
      isSample: true,
    },
    {
      id: "co_b",
      slug: "company-b",
      name: "샘플 회사 B",
      role: "프론트엔드 개발",
      period: { start: "2021-02", end: "2022-11" },
      summary: "B2B SaaS",
      tags: ["대시보드"],
      body: [],
      isSample: true,
    },
    {
      id: "co_c",
      slug: "company-c",
      name: "샘플 회사 C",
      role: "프론트엔드 개발",
      period: { start: "2023-01", end: "2024-06" },
      summary: "교육 플랫폼",
      tags: ["실시간 수업"],
      body: [],
      isSample: true,
    },
    {
      id: "co_d",
      slug: "company-d",
      name: "샘플 회사 D",
      role: "프론트엔드 개발",
      period: { start: "2024-08", end: null },
      summary: "커머스",
      tags: ["성능 개선"],
      body: [],
      isSample: true,
    },
  ],
  achievements: [
    {
      id: "ach_stability",
      context: ["샘플 회사 C", "품질 개선"],
      title: "끊기는 연결의 원인을 추적하다",
      metric: { label: "예시 지표", before: "85%", after: "96%" },
      description:
        "로그를 분석해 연결 종료 원인을 찾고 재연결 흐름을 개선한 사례를 적는 자리입니다.",
      companyId: "co_c",
      isSample: true,
    },
    {
      id: "ach_performance",
      context: ["샘플 회사 D", "프론트엔드"],
      title: "마이그레이션과 로딩 성능 개선",
      metric: { label: "예시 지표", before: "3.1초", after: "1.6초" },
      description: "프레임워크 전환과 함께 첫 화면 로딩을 개선한 사례를 적는 자리입니다.",
      companyId: "co_d",
      isSample: true,
    },
  ],
  techStack: [
    {
      id: "ts_frontend",
      label: "프론트엔드",
      items: ["TypeScript", "React", "Next.js", "Tailwind CSS"],
    },
    { id: "ts_mobile", label: "모바일", items: ["React Native", "Expo"] },
    { id: "ts_tooling", label: "도구", items: ["Storybook", "Playwright", "Turborepo"] },
  ],
  history: {
    chapters: [
      {
        id: "ch_learning",
        title: "챕터 1 · 팀에서 배우던 시기",
        summary: "회사에서 제품을 만들며 협업과 운영을 익힌 시기입니다. (샘플)",
        period: { start: "2019-03", end: "2022-11" },
        entries: [
          {
            id: "he_a",
            date: "2019-03",
            title: "샘플 회사 A 합류",
            ref: { kind: "company", id: "co_a" },
          },
          {
            id: "he_b",
            date: "2021-02",
            title: "샘플 회사 B 합류",
            ref: { kind: "company", id: "co_b" },
          },
        ],
      },
      {
        id: "ch_building",
        title: "챕터 2 · 직접 만드는 시기",
        summary: "회사 일과 함께 개인 제품을 기획·출시·운영하는 시기입니다. (샘플)",
        period: { start: "2023-01", end: null },
        entries: [
          {
            id: "he_bookmark",
            date: "2023-06",
            title: "책갈피 공개",
            ref: { kind: "project", id: "prj_bookmark" },
          },
          {
            id: "he_timecard",
            date: "2024-03",
            title: "타임카드 출시",
            ref: { kind: "project", id: "prj_timecard" },
          },
          {
            id: "he_note",
            date: "2025-01",
            title: "직접 작성한 히스토리 항목 예시",
            description: "회사나 프로젝트와 연결하지 않고 자유롭게 쓰는 항목입니다.",
          },
        ],
      },
    ],
  },
};
