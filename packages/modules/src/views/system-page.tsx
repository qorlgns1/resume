import type { ContentLibrary, ModuleInstance, Page } from "@resume/contracts";
import type { ReactNode } from "react";
import { BentoGrid } from "../bento-grid";
import type { RenderOptions, WrapContent } from "../types";
import { AboutView } from "./about-views";
import { CompanyListView } from "./company-views";
import { HistoryTimelineView } from "./history-views";
import { PageHeader } from "./page-header";
import { ProjectListView } from "./project-views";

/**
 * 기본 페이지(개인 프로젝트·회사 경험·히스토리·소개)의 본문.
 * 원본 콘텐츠로 목록·타임라인을 그리고, 어드민에서 배치한 모듈이 있으면 그 아래에 붙인다.
 * 공개 사이트와 어드민 미리보기가 함께 쓴다.
 */
export function SystemPageView({
  page,
  content,
  options = {},
  wrapModule,
  wrapContent,
  wrapChapter,
  listFooter,
}: {
  page: Page;
  content: ContentLibrary;
  options?: RenderOptions;
  /** 어드민 미리보기에서 모듈 선택 영역을 덧씌울 때 사용 */
  wrapModule?: (module: ModuleInstance, node: ReactNode) => ReactNode;
  /** 어드민 미리보기에서 목록의 원본 콘텐츠에 선택 영역을 덧씌울 때 사용 */
  wrapContent?: WrapContent;
  /** 어드민 미리보기에서 히스토리 챕터 카드 전체를 감쌀 때 사용 (순서 바꾸기) */
  wrapChapter?: WrapContent;
  /** 목록·타임라인 바로 아래에 붙일 내용. 어드민 미리보기의 추가 버튼에 쓴다. */
  listFooter?: ReactNode;
}) {
  const systemKey = page.kind === "system" ? page.systemKey : null;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={page.title} description={page.description} options={options} />
      {systemKey === "projects" ? (
        <ProjectListView content={content} options={options} wrapItem={wrapContent} />
      ) : null}
      {systemKey === "experience" ? (
        <CompanyListView content={content} options={options} wrapItem={wrapContent} />
      ) : null}
      {systemKey === "history" ? (
        <HistoryTimelineView
          content={content}
          options={options}
          wrapItem={wrapContent}
          wrapChapter={wrapChapter}
        />
      ) : null}
      {systemKey === "about" ? (
        <AboutView content={content} options={options} wrapItem={wrapContent} />
      ) : null}
      {listFooter}
      {page.modules.length > 0 ? (
        <BentoGrid page={page} content={content} options={options} wrapModule={wrapModule} />
      ) : null}
    </div>
  );
}
