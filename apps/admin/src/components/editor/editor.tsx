"use client";

import type { ContentLibrary, Page, SiteSettings } from "@resume/contracts";
import { useState } from "react";
import { PreviewCanvas } from "./preview-canvas";
import { SettingsPanel } from "./settings-panel";
import { Sidebar } from "./sidebar";
import { EditorTopBar } from "./top-bar";

export type PreviewViewport = "desktop" | "mobile";

interface EditorProps {
  pages: Page[];
  content: ContentLibrary;
  site: SiteSettings;
  publicSiteUrl: string | null;
}

/**
 * 어드민 편집 화면의 상태 루트.
 * 이번 단계에서는 선택 상태와 미리보기 크기만 다룬다. 편집 내용은 아직 없으므로 저장할 것도 없다.
 */
export function Editor({ pages, content, publicSiteUrl }: EditorProps) {
  const [pageId, setPageId] = useState(pages[0]?.id ?? "");
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");

  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  if (!page) return null;
  const selectedModule = page.modules.find((m) => m.id === moduleId) ?? null;

  function selectPage(id: string) {
    setPageId(id);
    setModuleId(null);
  }

  return (
    <div className="grid h-dvh min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <EditorTopBar
        page={page}
        viewport={viewport}
        onViewportChange={setViewport}
        publicSiteUrl={publicSiteUrl}
      />
      <div className="grid min-h-0 grid-cols-[17rem_minmax(0,1fr)_22rem]">
        <Sidebar
          pages={pages}
          currentPage={page}
          selectedModuleId={selectedModule?.id ?? null}
          onSelectPage={selectPage}
          onSelectModule={setModuleId}
        />
        <PreviewCanvas
          page={page}
          content={content}
          viewport={viewport}
          selectedModuleId={selectedModule?.id ?? null}
          onSelectModule={setModuleId}
        />
        <SettingsPanel page={page} module={selectedModule} content={content} />
      </div>
    </div>
  );
}
