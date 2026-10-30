import { findCompanyBySlug, formatPeriod } from "@resume/modules";
import { getPublicPage } from "@/lib/content/get-page";
import { OG_CONTENT_TYPE, OG_SIZE, ogImageResponse } from "@/lib/og-image";
import { resolveSiteUrl } from "@/lib/site-url";

export const alt = "회사 경험";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 회사 경험 상세의 공유 미리보기: 회사 이름, 역할과 기간 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, siteUrl] = await Promise.all([getPublicPage("experience"), resolveSiteUrl()]);
  if (!result.ok) return ogImageResponse({ title: "포트폴리오", name: "포트폴리오" });
  const { content, page } = result.response.data;
  const company = findCompanyBySlug(content, slug);
  const footer = siteUrl?.replace(/^https?:\/\//, "");
  if (!company) {
    return ogImageResponse({ title: page.title, name: content.profile.name, footer });
  }
  const description = [company.role, formatPeriod(company.period), company.summary]
    .filter(Boolean)
    .join(" · ");
  return ogImageResponse({
    eyebrow: page.title,
    title: company.name,
    description,
    name: content.profile.name,
    footer,
  });
}
