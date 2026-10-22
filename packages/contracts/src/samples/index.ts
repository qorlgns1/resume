import type { PublicPageResponse } from "../api";
import type { SystemPageKey } from "../page";
import { createPageResponse } from "../responses";
import type { SiteDocument } from "../versioning";
import { sampleContent, sampleSite } from "./content";
import { sampleHomePage, samplePages } from "./pages";

export { sampleContent, sampleHomePage, samplePages, sampleSite };

/** 저장소에 포함된 샘플 사이트 문서. 어드민 DB가 비어 있을 때 첫 초안과 첫 게시본으로 쓴다. */
export const sampleSiteDocument: SiteDocument = {
  site: sampleSite,
  content: sampleContent,
  pages: samplePages,
};

/**
 * 샘플 데이터로 공개 API 응답 형태를 만든다.
 * 공개 사이트의 샘플 모드가 사용한다.
 */
export function createSamplePageResponse(
  key: SystemPageKey,
  generatedAt: Date = new Date(),
): PublicPageResponse | null {
  return createPageResponse(sampleSiteDocument, key, {
    source: "sample",
    generatedAt: generatedAt.toISOString(),
  });
}
