import { publicPaths } from "@resume/contracts";
import { BentoGrid } from "@resume/modules";
import type { Metadata } from "next";
import { ContentError } from "@/components/content-error";
import { PageShell } from "@/components/page-shell";
import { getPublicPage } from "@/lib/content/get-page";
import { siteRenderOptions } from "@/lib/content/render-options";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const result = await getPublicPage("home");
  if (!result.ok) return { title: "콘텐츠를 불러오지 못했습니다" };
  const { site } = result.response.data;
  return pageMetadata({
    title: site.title,
    absoluteTitle: true,
    description: site.description,
    path: publicPaths.home,
    siteName: site.title,
  });
}

export default async function HomePage() {
  const result = await getPublicPage("home");
  if (!result.ok) return <ContentError result={result} />;

  const { page, content } = result.response.data;
  return (
    <PageShell response={result.response}>
      <BentoGrid page={page} content={content} options={siteRenderOptions} />
    </PageShell>
  );
}
