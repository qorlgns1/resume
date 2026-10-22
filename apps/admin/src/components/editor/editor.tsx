"use client";

import {
  configureKoreanErrors,
  type DraftState,
  type SiteDocument,
  SiteDocumentSchema,
} from "@resume/contracts";
import { Button } from "@resume/ui/components/button";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminApiError, adminApi } from "./api-client";
import { EditorContext, type EditorContextValue, type Selection } from "./editor-context";
import { IssueIndex } from "./issues";
import { PreviewCanvas } from "./preview-canvas";
import { SettingsPanel } from "./settings-panel";
import { Sidebar } from "./sidebar";
import { type EditorActions, EditorTopBar } from "./top-bar";

configureKoreanErrors();

export type PreviewViewport = "desktop" | "mobile";

interface EditorProps {
  initialDraft: DraftState;
  publicSiteUrl: string | null;
  userName: string;
}

type Feedback = { kind: "success" | "error"; message: string; conflict?: boolean } | null;

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * 어드민 편집 화면의 상태 루트.
 * - saved: 서버에 저장된 초안 / document: 화면에서 고치는 작업본
 * - 작업본이 바뀔 때마다 계약 스키마로 검사하고, 오류가 있으면 저장할 수 없다.
 * - 저장·게시·복원 결과는 서버 응답을 받은 뒤에만 알린다.
 */
export function Editor({ initialDraft, publicSiteUrl, userName }: EditorProps) {
  const [saved, setSaved] = useState(initialDraft);
  const [document, setDocument] = useState<SiteDocument>(initialDraft.document);
  const [pageId, setPageId] = useState(initialDraft.document.pages[0]?.id ?? "");
  const [selection, setSelection] = useState<Selection>(null);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const issues = useMemo(() => {
    const result = SiteDocumentSchema.safeParse(document);
    return new IssueIndex(result.success ? [] : result.error.issues);
  }, [document]);
  const dirty = useMemo(() => !sameJson(document, saved.document), [document, saved.document]);

  const edit = useCallback((mutate: (draft: SiteDocument) => void) => {
    // 다시 고치기 시작하면 지난 성공 안내는 더 이상 현재 상태가 아니다.
    setFeedback((current) => (current?.kind === "success" ? null : current));
    setDocument((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
  }, []);

  /** 서버의 최신 초안으로 화면을 맞춘다. */
  const applyServerDraft = useCallback((draft: DraftState) => {
    setSaved(draft);
    setDocument(draft.document);
    setPageId((current) =>
      draft.document.pages.some((p) => p.id === current)
        ? current
        : (draft.document.pages[0]?.id ?? ""),
    );
  }, []);

  const run = useCallback(
    async <T,>(task: () => Promise<T>, success: (result: T) => string): Promise<boolean> => {
      setBusy(true);
      setFeedback(null);
      try {
        const result = await task();
        setFeedback({ kind: "success", message: success(result) });
        return true;
      } catch (cause) {
        if (cause instanceof AdminApiError && cause.code === "unauthorized") {
          window.location.assign("/login");
          return false;
        }
        const conflict = cause instanceof AdminApiError && cause.code === "conflict";
        setFeedback({
          kind: "error",
          conflict,
          message: conflict
            ? "다른 탭이나 기기에서 초안이 먼저 바뀌었습니다. 덮어쓰지 않도록 저장을 멈췄습니다."
            : cause instanceof Error
              ? cause.message
              : "요청을 처리하지 못했습니다.",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const actions: EditorActions = {
    dirty,
    busy,
    save: async () => {
      if (!dirty || issues.count > 0) return;
      await run(
        async () => applyServerDraft(await adminApi.saveDraft(saved.revision, document)),
        () => "초안을 저장했습니다. 게시해야 공개 사이트에 반영됩니다.",
      );
    },
    publish: (note) =>
      run(
        async () => {
          const result = await adminApi.publish(saved.revision, note);
          applyServerDraft(result.draft);
          return result.published.version;
        },
        (version) => `버전 ${version}을 게시했습니다. 공개 사이트에 반영되었습니다.`,
      ),
    restore: (version) =>
      run(
        async () => applyServerDraft(await adminApi.restore(version, saved.revision)),
        () => `버전 ${version}의 내용을 초안으로 가져왔습니다. 게시해야 공개 사이트에 반영됩니다.`,
      ),
  };

  const reloadLatest = async () => {
    if (dirty && !window.confirm("저장하지 않은 변경 사항을 버리고 최신 초안을 불러올까요?"))
      return;
    await run(
      async () => applyServerDraft(await adminApi.getDraft()),
      () => "최신 초안을 불러왔습니다.",
    );
  };

  // 저장하지 않은 변경이 있으면 페이지를 떠날 때 경고한다.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Ctrl/⌘+S로 저장
  const save = actions.save;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const context: EditorContextValue = {
    document,
    saved,
    edit,
    issues,
    pageId,
    selectPage: (id) => {
      setPageId(id);
      setSelection(null);
    },
    selection,
    select: setSelection,
  };

  return (
    <EditorContext.Provider value={context}>
      <div className="grid h-dvh min-h-0 grid-rows-[auto_auto_minmax(0,1fr)]">
        <EditorTopBar
          viewport={viewport}
          onViewportChange={setViewport}
          publicSiteUrl={publicSiteUrl}
          userName={userName}
          actions={actions}
        />
        <div aria-live="polite" className="empty:hidden">
          {feedback ? (
            <div
              role={feedback.kind === "error" ? "alert" : "status"}
              className={
                feedback.kind === "error"
                  ? "flex items-center justify-between gap-3 bg-destructive-soft px-4 py-2 text-body-sm text-destructive"
                  : "flex items-center justify-between gap-3 bg-success-soft px-4 py-2 text-body-sm text-success"
              }
            >
              <span>{feedback.message}</span>
              <span className="flex gap-2">
                {feedback.conflict ? (
                  <Button size="xs" variant="outline" onClick={() => void reloadLatest()}>
                    최신 초안 불러오기
                  </Button>
                ) : null}
                <Button size="xs" variant="ghost" onClick={() => setFeedback(null)}>
                  닫기
                </Button>
              </span>
            </div>
          ) : null}
        </div>
        <div className="grid min-h-0 grid-cols-[17rem_minmax(0,1fr)_24rem]">
          <Sidebar />
          <PreviewCanvas viewport={viewport} />
          <SettingsPanel />
        </div>
      </div>
    </EditorContext.Provider>
  );
}
