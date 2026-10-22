import { PUBLIC_API_VERSION, type PublicPageResponse } from "../api";
import type { SystemPageKey } from "../page";
import { sampleContent, sampleSite } from "./content";
import { sampleHomePage, samplePages } from "./pages";

export { sampleContent, sampleHomePage, samplePages, sampleSite };

/**
 * 샘플 데이터로 공개 API 응답 형태를 만든다.
 * 어드민의 샘플 읽기 API와 공개 사이트의 샘플 모드가 같은 함수를 사용한다.
 */
export function createSamplePageResponse(
  key: SystemPageKey,
  generatedAt: Date = new Date(),
): PublicPageResponse | null {
  const page = samplePages.find((p) => p.kind === "system" && p.systemKey === key);
  if (!page) return null;
  return {
    schemaVersion: PUBLIC_API_VERSION,
    data: { site: sampleSite, page, content: sampleContent },
    meta: { source: "sample", generatedAt: generatedAt.toISOString() },
  };
}
