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
    { id: "nav_about", label: "소개", href: "/about" },
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
    about: [
      {
        id: "ab_note",
        type: "callout",
        tone: "info",
        text: [
          {
            text: "샘플 소개입니다. 인물·회사·경험은 모두 가상이며, 어드민의 콘텐츠 › 프로필 › 소개 페이지 본문에서 바꿀 수 있습니다.",
          },
        ],
      },
      {
        id: "ab_quote",
        type: "quote",
        text: [
          { text: "좋은 제품은 출시한 날이 아니라, 고쳐 나가는 날마다 만들어진다고 믿습니다." },
        ],
      },
      { id: "ab_h_who", type: "heading", level: 2, text: [{ text: "어떤 개발자인가요" }] },
      {
        id: "ab_p_who",
        type: "paragraph",
        text: [
          { text: "안녕하세요, 6년 차 프론트엔드 개발자 홍길동입니다. 작은 불편에서 출발해 " },
          { text: "직접 쓰는 제품", marks: ["bold"] },
          {
            text: "을 만들고, 출시한 뒤에도 사용자의 피드백으로 계속 고쳐 나가는 일을 가장 좋아합니다.",
          },
        ],
      },
      {
        id: "ab_p_who2",
        type: "paragraph",
        text: [
          {
            text: "화면을 만드는 데서 멈추지 않고, 왜 만드는지 정의하는 기획부터 배포·운영·지표 확인까지 한 흐름으로 맡는 것을 제 일이라고 생각합니다.",
          },
        ],
      },
      { id: "ab_h_path", type: "heading", level: 2, text: [{ text: "걸어온 길" }] },
      {
        id: "ab_p_path",
        type: "paragraph",
        text: [
          { text: "사내 업무 시스템과 B2B SaaS 대시보드를 만들며 " },
          { text: "팀에서 협업하고 운영하는 법", marks: ["bold"] },
          {
            text: "을 배웠습니다. 이후 교육 플랫폼에서 실시간 수업 화면의 연결 안정성을, 커머스에서 첫 화면 로딩 성능을 개선했습니다.",
          },
        ],
      },
      {
        id: "ab_p_path2",
        type: "paragraph",
        text: [
          { text: "회사 밖에서는 " },
          { text: "타임카드", href: "/projects/timecard" },
          { text: "와 " },
          { text: "책갈피", href: "/projects/bookmark" },
          {
            text: "처럼 제가 먼저 필요했던 서비스를 직접 기획하고 출시해 운영하고 있습니다. 자세한 흐름은 ",
          },
          { text: "히스토리", href: "/history" },
          { text: "에 정리해 두었습니다." },
        ],
      },
      { id: "ab_h_how", type: "heading", level: 2, text: [{ text: "어떻게 일하나요" }] },
      {
        id: "ab_list_how",
        type: "bulleted-list",
        items: [
          {
            text: [{ text: "문제를 먼저 정의합니다", marks: ["bold"] }],
            children: [
              {
                text: [
                  { text: "누가, 언제, 왜 불편한지 한 문장으로 쓸 수 있을 때 만들기 시작합니다." },
                ],
              },
              { text: [{ text: "가장 작은 해결책부터 내놓고 반응을 봅니다." }] },
            ],
          },
          {
            text: [{ text: "끝까지 책임집니다", marks: ["bold"] }],
            children: [
              { text: [{ text: "배포 자동화와 오류 모니터링까지 직접 챙깁니다." }] },
              { text: [{ text: "출시 후 첫 2주는 사용자 문의와 로그를 매일 확인합니다." }] },
            ],
          },
          {
            text: [{ text: "근거로 우선순위를 정합니다", marks: ["bold"] }],
            children: [
              { text: [{ text: "지표와 사용자 의견을 함께 보고, 바꾼 결과를 다시 측정합니다." }] },
            ],
          },
        ],
      },
      { id: "ab_h_team", type: "heading", level: 2, text: [{ text: "함께 일할 때" }] },
      {
        id: "ab_table_team",
        type: "table",
        headerRow: true,
        rows: [
          [[{ text: "상황" }], [{ text: "이렇게 합니다" }]],
          [
            [{ text: "요구사항이 모호할 때" }],
            [{ text: "화면 초안과 질문 목록을 먼저 만들어 짧게 맞춥니다." }],
          ],
          [
            [{ text: "일정이 빠듯할 때" }],
            [{ text: "꼭 필요한 범위와 나중에 해도 되는 범위를 나눠 제안합니다." }],
          ],
          [
            [{ text: "의견이 다를 때" }],
            [{ text: "사용자 관점의 근거를 기준으로 이야기하고, 결정은 문서로 남깁니다." }],
          ],
          [
            [{ text: "코드 리뷰" }],
            [{ text: "왜 그렇게 했는지 설명을 남기고, 리뷰는 하루 안에 답합니다." }],
          ],
        ],
      },
      { id: "ab_h_now", type: "heading", level: 2, text: [{ text: "요즘 관심 있는 것" }] },
      {
        id: "ab_list_now",
        type: "bulleted-list",
        items: [
          { text: [{ text: "접근성과 성능을 처음부터 고려한 디자인 시스템" }] },
          {
            text: [
              { text: "React Server Components와 " },
              { text: "Next.js", marks: ["code"] },
              { text: " App Router로 화면 구조 단순하게 만들기" },
            ],
          },
          { text: [{ text: "Playwright로 핵심 흐름을 지키는 가벼운 스모크 테스트" }] },
        ],
      },
      { id: "ab_h_next", type: "heading", level: 2, text: [{ text: "이런 팀을 찾고 있어요" }] },
      {
        id: "ab_p_next",
        type: "paragraph",
        text: [
          {
            text: "사용자 가까이에서 빠르게 만들고 배우는 팀, 개발자도 제품의 방향을 함께 고민하는 팀에서 일하고 싶습니다. 이야기 나누고 싶으시면 ",
          },
          { text: "메일", href: "mailto:hello@example.com" },
          { text: "로 편하게 연락 주세요." },
        ],
      },
    ],
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
      body: [
        {
          id: "tc_note",
          type: "callout",
          tone: "info",
          text: [
            {
              text: "샘플 본문입니다. 어드민의 콘텐츠 › 프로젝트 › 본문 편집에서 바꿀 수 있습니다.",
            },
          ],
        },
        { id: "tc_h_problem", type: "heading", level: 2, text: [{ text: "문제" }] },
        {
          id: "tc_p_problem",
          type: "paragraph",
          text: [
            { text: "근무 시간을 " },
            { text: "직접 계산", marks: ["bold"] },
            { text: "하고 기록하는 일이 번거롭다는 가상의 문제에서 출발했습니다." },
          ],
        },
        { id: "tc_h_solution", type: "heading", level: 2, text: [{ text: "만든 것" }] },
        {
          id: "tc_list",
          type: "bulleted-list",
          items: [
            { text: [{ text: "출근·퇴근 한 번에 기록" }] },
            {
              text: [{ text: "주간 합계" }],
              children: [
                { text: [{ text: "요일별 근무 시간" }] },
                { text: [{ text: "예상 급여 계산" }] },
              ],
            },
          ],
        },
        { id: "tc_divider", type: "divider" },
        {
          id: "tc_quote",
          type: "quote",
          text: [{ text: "작게 시작해서, 출시 후에 꾸준히 개선한다." }],
        },
      ],
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
    },
    {
      id: "co_c",
      slug: "company-c",
      name: "샘플 회사 C",
      role: "프론트엔드 개발",
      period: { start: "2023-01", end: "2024-06" },
      summary: "교육 플랫폼",
      tags: ["실시간 수업"],
      body: [
        {
          id: "coc_note",
          type: "callout",
          tone: "info",
          text: [{ text: "샘플 회사의 예시 본문입니다. 실제 경력이 아닙니다." }],
        },
        { id: "coc_h_role", type: "heading", level: 2, text: [{ text: "맡은 일" }] },
        {
          id: "coc_list",
          type: "bulleted-list",
          items: [
            { text: [{ text: "실시간 수업 화면 개발" }] },
            { text: [{ text: "연결 안정성 개선" }] },
          ],
        },
      ],
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
    },
    {
      id: "ach_performance",
      context: ["샘플 회사 D", "프론트엔드"],
      title: "마이그레이션과 로딩 성능 개선",
      metric: { label: "예시 지표", before: "3.1초", after: "1.6초" },
      description: "프레임워크 전환과 함께 첫 화면 로딩을 개선한 사례를 적는 자리입니다.",
      companyId: "co_d",
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
  education: [
    {
      id: "edu_sample",
      school: "샘플 대학교",
      major: "컴퓨터공학",
      degree: "학사",
      period: { start: "2015-03", end: "2019-02" },
      note: "샘플 덧붙임",
    },
  ],
  certifications: [
    { id: "cert_sample", name: "정보처리기사", issuer: "한국산업인력공단", date: "2019-08" },
  ],
};
