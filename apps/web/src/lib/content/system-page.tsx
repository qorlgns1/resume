import type { SystemPageKey } from "@resume/contracts";
import { SystemPageView } from "@resume/modules";
import type { Metadata } from "next";
import { ContentError } from "@/components/content-error";
import { PageShell } from "@/components/page-shell";
import { getPublicPage } from "./get-page";
import { siteRenderOptions } from "./render-options";

export type ListPageKey = Exclude<SystemPageKey, "home">;

/** 홈 외 기본 페이지(개인 프로젝트·회사 경험·히스토리)의 메타데이터 */
export async function systemPageMetadata(key: ListPageKey): Promise<Metadata> {
  const result = await getPublicPage(key);
  if (!result.ok) return { title: "콘텐츠를 불러오지 못했습니다" };
  return {
    title: result.response.data.page.title,
    description: result.response.data.page.description,
  };
}

/** 홈 외 기본 페이지. 목록·타임라인과 어드민에서 배치한 모듈을 보여준다. */
export async function SystemPage({ pageKey }: { pageKey: ListPageKey }) {
  const result = await getPublicPage(pageKey);
  if (!result.ok) return <ContentError result={result} />;
  const { page, content } = result.response.data;
  return (
    <PageShell response={result.response}>
      <div className="pt-6">
        <SystemPageView page={page} content={content} options={siteRenderOptions} />
      </div>
    </PageShell>
  );
}
