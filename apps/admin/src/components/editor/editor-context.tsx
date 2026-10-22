"use client";

import type { DraftState, SiteDocument } from "@resume/contracts";
import { createContext, useContext } from "react";
import type { IssueIndex } from "./issues";

export type ContentSection =
  | "site"
  | "profile"
  | "projects"
  | "companies"
  | "achievements"
  | "techStack"
  | "history"
  | "media";

export type Selection =
  | { kind: "module"; moduleId: string }
  | { kind: "content"; section: ContentSection; itemId?: string }
  | null;

export interface EditorContextValue {
  /** 화면에서 고치는 작업본 */
  document: SiteDocument;
  /** 서버에 저장된 초안 상태 */
  saved: DraftState;
  /** 작업본 수정. 복사본을 받아 고치면 된다. */
  edit: (mutate: (draft: SiteDocument) => void) => void;
  issues: IssueIndex;
  pageId: string;
  selectPage: (pageId: string) => void;
  selection: Selection;
  select: (selection: Selection) => void;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error("EditorContext가 없습니다.");
  return value;
}

/** 현재 페이지와 그 인덱스 */
export function useCurrentPage() {
  const { document, pageId } = useEditor();
  const pageIndex = Math.max(
    0,
    document.pages.findIndex((p) => p.id === pageId),
  );
  // biome-ignore lint/style/noNonNullAssertion: 문서에는 항상 홈 페이지가 있다
  return { page: document.pages[pageIndex]!, pageIndex };
}
