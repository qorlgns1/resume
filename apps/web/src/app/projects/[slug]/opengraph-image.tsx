import { findProjectBySlug } from "@resume/modules";
import { getPublicPage } from "@/lib/content/get-page";
import { OG_CONTENT_TYPE, OG_SIZE, ogImageResponse } from "@/lib/og-image";
import { resolveSiteUrl } from "@/lib/site-url";

export const alt = "개인 프로젝트";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 프로젝트 상세의 공유 미리보기: 제목과 한 줄 소개 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, siteUrl] = await Promise.all([getPublicPage("projects"), resolveSiteUrl()]);
  if (!result.ok) return ogImageResponse({ title: "포트폴리오", name: "포트폴리오" });
  const { content, page } = result.response.data;
  const project = findProjectBySlug(content, slug);
  const footer = siteUrl?.replace(/^https?:\/\//, "");
  if (!project) {
    return ogImageResponse({ title: page.title, name: content.profile.name, footer });
  }
  return ogImageResponse({
    eyebrow: page.title,
    title: project.title,
    description: project.tagline || project.summary,
    name: content.profile.name,
    footer,
  });
}
