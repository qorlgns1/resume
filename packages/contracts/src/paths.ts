/** 공개 사이트 주소 규칙. 링크를 만드는 모든 곳이 이 함수를 쓴다. */
export const publicPaths = {
  home: "/",
  projects: "/projects",
  project: (slug: string) => `/projects/${slug}`,
  experience: "/experience",
  company: (slug: string) => `/experience/${slug}`,
  history: "/history",
  about: "/about",
} as const;
