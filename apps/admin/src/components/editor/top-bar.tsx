"use client";

import type { VersionSummary } from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { Button, buttonVariants } from "@resume/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@resume/ui/components/dialog";
import { Field, FieldDescription, FieldLabel } from "@resume/ui/components/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@resume/ui/components/sheet";
import { Textarea } from "@resume/ui/components/textarea";
import { cn } from "@resume/ui/lib/utils";
import {
  AlertCircle,
  ArrowUpRight,
  History,
  Monitor,
  RotateCcw,
  Save,
  Send,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "./api-client";
import type { PreviewViewport } from "./editor";
import { useCurrentPage, useEditor } from "./editor-context";
import { describeIssuePath } from "./issues";
import { SignOutButton } from "./sign-out-button";

export interface EditorActions {
  dirty: boolean;
  busy: boolean;
  save: () => Promise<void>;
  publish: (note: string) => Promise<boolean>;
  restore: (version: number) => Promise<boolean>;
}

interface TopBarProps {
  viewport: PreviewViewport;
  onViewportChange: (viewport: PreviewViewport) => void;
  publicSiteUrl: string | null;
  userName: string;
  actions: EditorActions;
}

const viewports = [
  { value: "desktop", label: "데스크톱", detail: "1440px", Icon: Monitor },
  { value: "mobile", label: "모바일", detail: "390px", Icon: Smartphone },
] as const;

const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" });

export function EditorTopBar({
  viewport,
  onViewportChange,
  publicSiteUrl,
  userName,
  actions,
}: TopBarProps) {
  const { saved, issues } = useEditor();
  const { page } = useCurrentPage();
  const [publishOpen, setPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);

  const status = actions.dirty
    ? { tone: "warning" as const, text: "저장하지 않은 변경" }
    : saved.hasUnpublishedChanges
      ? { tone: "primary" as const, text: "게시하지 않은 초안" }
      : { tone: "neutral" as const, text: `게시됨 · 버전 ${saved.latestVersion ?? "-"}` };

  const saveDisabledReason = !actions.dirty
    ? "저장할 변경 사항이 없습니다."
    : issues.count > 0
      ? "오류를 고쳐야 저장할 수 있습니다."
      : null;
  const publishDisabledReason = actions.dirty
    ? "먼저 초안을 저장하세요."
    : !saved.hasUnpublishedChanges
      ? "게시할 변경 사항이 없습니다."
      : null;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <p className="shrink-0 font-extrabold tracking-tight">포트폴리오 어드민</p>
        <span className="text-border-strong" aria-hidden="true">
          /
        </span>
        <h1 className="truncate text-body-sm font-semibold">{page.title}</h1>
        <Badge
          variant={
            status.tone === "warning" ? "warning" : status.tone === "primary" ? "soft" : "outline"
          }
          className="shrink-0 rounded-sm"
          data-testid="draft-status"
        >
          {status.text}
        </Badge>
        {issues.count > 0 ? (
          <Button
            variant="ghost"
            size="xs"
            className="shrink-0 text-destructive"
            onClick={() => setIssuesOpen(true)}
          >
            <AlertCircle aria-hidden="true" />
            오류 {issues.count}개
          </Button>
        ) : null}
      </div>

      <fieldset className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary p-1">
        <legend className="sr-only">미리보기 크기</legend>
        {viewports.map(({ value, label, detail, Icon }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={viewport === value}
            onClick={() => onViewportChange(value)}
            className={cn(
              "text-muted-foreground",
              viewport === value && "bg-card text-foreground shadow-card hover:bg-card",
            )}
          >
            <Icon aria-hidden="true" />
            {label}
            <span className="text-caption font-normal text-subtle-foreground">{detail}</span>
          </Button>
        ))}
      </fieldset>

      <div className="flex shrink-0 items-center gap-1.5">
        {publicSiteUrl ? (
          <a
            href={publicSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            공개 사이트
            <ArrowUpRight aria-hidden="true" />
            <span className="sr-only">(새 탭에서 열림)</span>
          </a>
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
          <History aria-hidden="true" />
          버전 기록
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={saveDisabledReason !== null || actions.busy}
          title={saveDisabledReason ?? "초안 저장 (Ctrl/⌘+S)"}
          onClick={() => void actions.save()}
        >
          <Save aria-hidden="true" />
          초안 저장
        </Button>
        <Button
          size="sm"
          disabled={publishDisabledReason !== null || actions.busy}
          title={publishDisabledReason ?? "공개 사이트에 반영"}
          onClick={() => setPublishOpen(true)}
        >
          <Send aria-hidden="true" />
          게시
        </Button>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <span className="text-body-sm text-muted-foreground">{userName}</span>
        <SignOutButton />
      </div>

      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} actions={actions} />
      <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} actions={actions} />
      <IssuesDialog open={issuesOpen} onOpenChange={setIssuesOpen} />
    </header>
  );
}

function PublishDialog({
  open,
  onOpenChange,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: EditorActions;
}) {
  const { saved } = useEditor();
  const [note, setNote] = useState("");
  const nextVersion = (saved.latestVersion ?? 0) + 1;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>버전 {nextVersion}로 게시할까요?</DialogTitle>
          <DialogDescription>
            저장된 초안이 공개 사이트에 반영됩니다. 이전 버전은 버전 기록에 남아 언제든 복원할 수
            있습니다.
            {saved.restoredFrom
              ? ` 이 초안은 버전 ${saved.restoredFrom}에서 복원한 내용입니다.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="publish-note">메모 (선택)</FieldLabel>
          <Textarea
            id="publish-note"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 프로젝트 목록 순서 변경"
          />
          <FieldDescription>버전 기록에 함께 남습니다.</FieldDescription>
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button
            disabled={actions.busy}
            onClick={async () => {
              if (await actions.publish(note)) {
                setNote("");
                onOpenChange(false);
              }
            }}
          >
            게시
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorySheet({
  open,
  onOpenChange,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: EditorActions;
}) {
  const { saved } = useEditor();
  const [versions, setVersions] = useState<VersionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);

  // 열 때마다 최신 목록을 불러온다.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setVersions(null);
    setError(null);
    adminApi
      .listVersions()
      .then((list) => {
        if (!cancelled) setVersions(list);
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "버전 기록을 불러오지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(26rem,90vw)] gap-0 sm:max-w-md">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-title">버전 기록</SheetTitle>
          <SheetDescription>
            게시할 때마다 버전이 남습니다. 복원하면 그 버전의 내용을 초안으로 가져오며, 게시해야
            공개 사이트에 반영됩니다.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {error ? (
            <p
              role="alert"
              className="rounded-md bg-destructive-soft px-3 py-2 text-body-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          {versions === null && !error ? (
            <p className="text-body-sm text-muted-foreground">불러오는 중…</p>
          ) : null}
          <ol className="flex flex-col gap-2">
            {versions?.map((v) => (
              <li
                key={v.version}
                className="flex flex-col gap-1.5 rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    버전 {v.version}
                    {v.version === saved.latestVersion ? (
                      <Badge variant="soft" className="ml-2 rounded-sm align-middle">
                        현재 게시
                      </Badge>
                    ) : null}
                  </span>
                  <time className="text-caption text-subtle-foreground" dateTime={v.publishedAt}>
                    {dateFormat.format(new Date(v.publishedAt))}
                  </time>
                </div>
                {v.note ? <p className="text-body-sm text-muted-foreground">{v.note}</p> : null}
                {v.restoredFrom ? (
                  <p className="text-caption text-subtle-foreground">
                    버전 {v.restoredFrom}에서 복원
                  </p>
                ) : null}
                <Button
                  variant="outline"
                  size="xs"
                  className="self-start"
                  onClick={() => setConfirm(v.version)}
                >
                  <RotateCcw aria-hidden="true" />이 버전으로 초안 복원
                </Button>
              </li>
            ))}
          </ol>
        </div>
      </SheetContent>
      <Dialog open={confirm !== null} onOpenChange={(next) => !next && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>버전 {confirm}의 내용으로 초안을 바꿀까요?</DialogTitle>
            <DialogDescription>
              {actions.dirty ? "저장하지 않은 변경 사항은 사라집니다. " : ""}
              지금 초안은 이 버전의 내용으로 바뀝니다. 공개 사이트에는 게시해야 반영됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button
              disabled={actions.busy}
              onClick={async () => {
                if (confirm !== null && (await actions.restore(confirm))) {
                  setConfirm(null);
                  onOpenChange(false);
                }
              }}
            >
              복원
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

function IssuesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { document, issues } = useEditor();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>고쳐야 할 오류 {issues.count}개</DialogTitle>
          <DialogDescription>
            오류가 있으면 저장할 수 없습니다. 해당 항목을 열어 고쳐 주세요.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {issues.list.map((issue) => (
            <li
              key={`${issue.key}:${issue.message}`}
              className="rounded-md bg-muted px-3 py-2 text-body-sm"
            >
              <span className="block text-caption text-muted-foreground">
                {describeIssuePath(document, issue.path)}
              </span>
              {issue.message}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
