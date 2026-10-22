import { publicPaths } from "@resume/contracts";
import { BackLink, findProjectBySlug, ProjectDetailView } from "@resume/modules";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentError } from "@/components/content-error";
import { PageShell } from "@/components/page-shell";
import { getPublicPage } from "@/lib/content/get-page";
import { siteRenderOptions } from "@/lib/content/render-options";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicPage("projects");
  if (!result.ok) return { title: "콘텐츠를 불러오지 못했습니다" };
  const project = findProjectBySlug(result.response.data.content, slug);
  return project ? { title: project.title, description: project.tagline } : {};
}

/** 개인 프로젝트 상세 */
export default async function ProjectDetailPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const result = await getPublicPage("projects");
  if (!result.ok) return <ContentError result={result} />;
  const { page, content } = result.response.data;
  const project = findProjectBySlug(content, slug);
  if (!project) notFound();

  return (
    <PageShell response={result.response}>
      <div className="flex flex-col gap-4 pt-6">
        <BackLink label={page.title} href={publicPaths.projects} options={siteRenderOptions} />
        <ProjectDetailView project={project} options={siteRenderOptions} />
      </div>
    </PageShell>
  );
}
