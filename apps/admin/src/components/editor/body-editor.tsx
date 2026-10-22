"use client";

import type { Block } from "@resume/contracts";
import { Button } from "@resume/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@resume/ui/components/sheet";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useEditor } from "./editor-context";
import type { Path } from "./issues";
import { useMediaLibrary } from "./media-library";

// 블록 편집기는 브라우저 전용이고 용량이 커서, 본문 편집을 열 때만 불러온다.
const BlockEditor = dynamic(
  () => import("../block-editor/block-editor").then((m) => m.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <p className="px-1 py-8 text-body-sm text-muted-foreground">편집기를 불러오는 중…</p>
    ),
  },
);

interface BodyEditorProps {
  /** 패널 제목에 쓸 항목 이름 */
  title: string;
  body: readonly Block[];
  /** 본문 경로: ["content", "projects", i, "body"] */
  path: Path;
  onChange: (blocks: Block[]) => void;
}

/**
 * 프로젝트·회사 상세 본문 편집. 넓은 패널에서 노션처럼 쓰고, 바뀐 내용은 바로 작업본에 반영된다.
 * 저장·게시는 다른 편집과 마찬가지로 상단의 초안 저장·게시를 쓴다.
 */
export function BodyEditor({ title, body, path, onChange }: BodyEditorProps) {
  const { issues } = useEditor();
  const { upload, lookup } = useMediaLibrary();
  const [warnings, setWarnings] = useState<string[]>([]);
  const bodyIssues = issues.under(path);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-col">
          <span className="text-caption font-semibold text-muted-foreground">상세 본문</span>
          <span className="text-body-sm">
            {body.length > 0 ? `블록 ${body.length}개` : "아직 비어 있습니다"}
          </span>
        </span>
        <Sheet onOpenChange={(open) => !open && setWarnings([])}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText aria-hidden="true" />
              본문 편집
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[min(56rem,96vw)] gap-0 sm:max-w-none"
            onEscapeKeyDown={(event) => {
              // 편집기 안의 Esc는 슬래시 메뉴·서식 도구를 닫는 데 쓰인다. 패널까지 닫지 않는다.
              if (document.activeElement?.closest(".bn-editor")) event.preventDefault();
            }}
          >
            <SheetHeader className="border-b border-border px-6 pt-5 pb-4">
              <SheetTitle className="text-title">{title} 본문</SheetTitle>
              <SheetDescription>
                <kbd className="rounded-xs bg-muted px-1 font-mono">/</kbd>로 블록을 추가하고, 블록
                왼쪽 손잡이로 순서를 바꿉니다. 목록은 Tab으로 3단계까지 들여쓸 수 있습니다. 편집 중
                Esc는 편집기 메뉴만 닫으며, 패널은 오른쪽 위 닫기 버튼으로 닫습니다. 바뀐 내용은
                초안 저장 후 게시하면 공개됩니다.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {warnings.length > 0 ? (
                <ul
                  role="status"
                  className="mb-3 list-disc rounded-md bg-warning-soft py-2 pr-3 pl-7 text-caption text-warning"
                >
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
              {bodyIssues.length > 0 ? (
                <p
                  role="alert"
                  className="mb-3 rounded-md bg-destructive-soft px-3 py-2 text-caption text-destructive"
                >
                  {bodyIssues.map((issue) => issue.message).join(" ")}
                </p>
              ) : null}
              <BlockEditor
                label={`${title} 본문`}
                initialBlocks={body}
                uploadMedia={upload}
                lookupMedia={lookup}
                onChange={(result) => {
                  setWarnings(result.warnings);
                  onChange(result.blocks);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
