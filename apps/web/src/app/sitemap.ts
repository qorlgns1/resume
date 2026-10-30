import { publicPaths } from "@resume/contracts";
import type { MetadataRoute } from "next";
import { getPublicPage } from "@/lib/content/get-page";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * 검색 엔진용 사이트맵. 기본 페이지와 게시된 프로젝트·회사 상세 주소를 담는다.
 * 콘텐츠를 읽지 못하면 기본 페이지만 담는다 (오류 페이지 주소를 색인시키지 않기 위해 상세는 뺀다).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, result] = await Promise.all([resolveSiteUrl(), getPublicPage("home")]);
  const base = siteUrl ?? "";
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    priority,
  });

  const entries = [
    entry(publicPaths.home, 1),
    entry(publicPaths.about, 0.8),
    entry(publicPaths.projects, 0.8),
    entry(publicPaths.experience, 0.8),
    entry(publicPaths.history, 0.6),
  ];
  if (!result.ok) return entries;

  const { projects, companies } = result.response.data.content;
  entries.push(
    ...projects.map((p) => entry(publicPaths.project(p.slug), 0.7)),
    ...companies.map((c) => entry(publicPaths.company(c.slug), 0.7)),
  );
  return entries;
}
