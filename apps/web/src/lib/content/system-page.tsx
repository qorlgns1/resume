import type { SystemPageKey } from "@resume/contracts";
import type { Metadata } from "next";
import { ContentError } from "@/components/content-error";
import { PageShell } from "@/components/page-shell";
import { PlaceholderPage } from "@/components/placeholder-page";
import { getPublicPage } from "./get-page";

type PlaceholderKey = Exclude<SystemPageKey, "home">;

/** 홈 외 기본 페이지(개인 프로젝트·회사 경험·히스토리)의 메타데이터 */
export async function systemPageMetadata(key: PlaceholderKey): Promise<Metadata> {
  const result = await getPublicPage(key);
  if (!result.ok) return { title: "콘텐츠를 불러오지 못했습니다" };
  return {
    title: result.response.data.page.title,
    description: result.response.data.page.description,
  };
}

/** 홈 외 기본 페이지의 공통 화면. 이번 단계에서는 빈 상태를 보여준다. */
export async function SystemPage({
  pageKey,
  planned,
}: {
  pageKey: PlaceholderKey;
  planned: string;
}) {
  const result = await getPublicPage(pageKey);
  if (!result.ok) return <ContentError result={result} />;
  return (
    <PageShell response={result.response}>
      <PlaceholderPage page={result.response.data.page} planned={planned} />
    </PageShell>
  );
}
