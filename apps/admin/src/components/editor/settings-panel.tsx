"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@resume/ui/components/empty";
import { MousePointerClick } from "lucide-react";
import { ContentSettings } from "./content-settings";
import { useCurrentPage, useEditor } from "./editor-context";
import { ModuleSettings } from "./module-settings";

export function SettingsPanel() {
  const { selection } = useEditor();
  const { page } = useCurrentPage();
  const module =
    selection?.kind === "module"
      ? page.modules.find((m) => m.id === selection.moduleId)
      : undefined;

  return (
    <aside aria-label="설정" className="min-h-0 overflow-y-auto border-l border-border bg-card">
      {module ? <ModuleSettings key={module.id} module={module} /> : null}
      {selection?.kind === "content" ? (
        <ContentSettings
          key={`${selection.section}:${selection.itemId ?? ""}`}
          section={selection.section}
          itemId={selection.itemId}
        />
      ) : null}
      {!module && selection?.kind !== "content" ? (
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MousePointerClick aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>모듈이나 콘텐츠를 선택하세요</EmptyTitle>
            <EmptyDescription>
              미리보기나 왼쪽 목록에서 고르면 여기서 편집할 수 있습니다. 바꾼 내용은 미리보기에 바로
              보이고, 저장해야 초안에 남습니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </aside>
  );
}
