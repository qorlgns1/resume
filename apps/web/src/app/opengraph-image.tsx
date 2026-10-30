import { getPublicPage } from "@/lib/content/get-page";
import { OG_CONTENT_TYPE, OG_SIZE, ogImageResponse } from "@/lib/og-image";
import { resolveSiteUrl } from "@/lib/site-url";

export const alt = "포트폴리오";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 홈과 목록·소개 페이지의 공유 미리보기: 프로필의 대표 문구 */
export default async function Image() {
  const [result, siteUrl] = await Promise.all([getPublicPage("home"), resolveSiteUrl()]);
  if (!result.ok) {
    return ogImageResponse({ title: "포트폴리오", name: "포트폴리오" });
  }
  const { profile } = result.response.data.content;
  return ogImageResponse({
    eyebrow: profile.roleEyebrow || profile.role,
    title: profile.headline,
    description: profile.summary,
    name: profile.name,
    footer: siteUrl?.replace(/^https?:\/\//, ""),
  });
}
