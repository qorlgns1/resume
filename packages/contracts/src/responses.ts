import { PUBLIC_API_VERSION, type PublicPageResponse } from "./api";
import type { SystemPageKey } from "./page";
import type { SiteDocument } from "./versioning";

/** SiteDocument에서 공개 API의 페이지 응답을 만든다. 페이지가 없으면 null. */
export function createPageResponse(
  document: SiteDocument,
  key: SystemPageKey,
  meta: PublicPageResponse["meta"],
): PublicPageResponse | null {
  const page = document.pages.find((p) => p.kind === "system" && p.systemKey === key);
  if (!page) return null;
  return {
    schemaVersion: PUBLIC_API_VERSION,
    data: { site: document.site, page, content: document.content },
    meta,
  };
}
