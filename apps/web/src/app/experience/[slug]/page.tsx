import { publicPaths } from "@resume/contracts";
import { BackLink, CompanyDetailView, findCompanyBySlug } from "@resume/modules";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentError } from "@/components/content-error";
import { PageShell } from "@/components/page-shell";
import { getPublicPage } from "@/lib/content/get-page";
import { siteRenderOptions } from "@/lib/content/render-options";

export async function generateMetadata({
  params,
}: PageProps<"/experience/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicPage("experience");
  if (!result.ok) return { title: "콘텐츠를 불러오지 못했습니다" };
  const company = findCompanyBySlug(result.response.data.content, slug);
  return company ? { title: company.name, description: company.summary } : {};
}

/** 회사 경험 상세 */
export default async function CompanyDetailPage({ params }: PageProps<"/experience/[slug]">) {
  const { slug } = await params;
  const result = await getPublicPage("experience");
  if (!result.ok) return <ContentError result={result} />;
  const { page, content } = result.response.data;
  const company = findCompanyBySlug(content, slug);
  if (!company) notFound();

  return (
    <PageShell response={result.response}>
      <div className="flex flex-col gap-4 pt-6">
        <BackLink label={page.title} href={publicPaths.experience} options={siteRenderOptions} />
        <CompanyDetailView company={company} content={content} />
      </div>
    </PageShell>
  );
}
