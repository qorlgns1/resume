import type { PublicPageResponse } from "@resume/contracts";
import type { ReactNode } from "react";
import { SampleNotice } from "./sample-notice";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[calc(var(--rs-layout-max-width)+2*var(--rs-layout-gutter-lg))] flex-col px-(--rs-layout-gutter) lg:px-(--rs-layout-gutter-lg)">
      {children}
    </div>
  );
}

/** 콘텐츠를 정상적으로 불러온 페이지의 공통 틀 */
export function PageShell({
  response,
  children,
}: {
  response: PublicPageResponse;
  children: ReactNode;
}) {
  const { site, content } = response.data;
  return (
    <PageContainer>
      <SiteHeader
        name={content.profile.name}
        role={content.profile.role}
        navigation={site.navigation}
      />
      {/* 샘플 모드이거나, 게시본이 아직 저장소의 샘플 콘텐츠일 때 */}
      {response.meta.source === "sample" || content.profile.isSample ? <SampleNotice /> : null}
      <main id="main" className="flex-1 pb-12">
        {children}
      </main>
      <SiteFooter name={content.profile.name} footer={site.footer} />
    </PageContainer>
  );
}
