import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/** 검색 엔진 안내. 전부 허용하고 사이트맵 주소를 알린다. 업로드 이미지 전달 경로는 색인하지 않는다. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await resolveSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/media/"] },
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
