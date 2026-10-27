import type { ContentLibrary, ModuleInstance, ModuleType } from "@resume/contracts";
import type { ComponentType, ReactNode } from "react";

/** next/link 같은 라우터 링크를 주입하기 위한 최소 인터페이스 */
export type LinkComponent = ComponentType<{
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}>;

export interface RenderOptions {
  /** 내부 경로(/...)에 사용할 링크 컴포넌트. 없으면 <a>를 사용한다. */
  Link?: LinkComponent;
  /**
   * true면 링크를 이동하지 않는 텍스트로 렌더링한다.
   * 어드민 미리보기에서 모듈 선택과 링크 이동이 겹치지 않게 한다.
   */
  inert?: boolean;
  /**
   * 업로드 이미지 주소의 앞부분. 공개 사이트는 "/media"(기본값), 어드민 미리보기는 어드민 API 주소를 쓴다.
   */
  mediaBase?: string;
}

/** 기본 페이지 목록에서 고를 수 있는 원본 콘텐츠 하나 (어드민 미리보기에서 편집 대상으로 고른다) */
export interface ContentTarget {
  section: "projects" | "companies" | "history";
  itemId: string;
  /** 선택 버튼의 접근성 이름에 쓴다 */
  label: string;
}

/** 목록의 원본 콘텐츠를 감싸는 함수. 어드민 미리보기에서 선택 영역을 덧씌울 때 사용한다. */
export type WrapContent = (target: ContentTarget, node: ReactNode) => ReactNode;

/** 감싸지 않고 그대로 둔다 (WrapContent 기본값) */
export const keepNode: WrapContent = (_target, node) => node;

export interface ModuleRenderProps<T extends ModuleType = ModuleType> {
  module: Extract<ModuleInstance, { type: T }>;
  content: ContentLibrary;
  options: RenderOptions;
}
