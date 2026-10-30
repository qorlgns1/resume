"use client";

import type { Link } from "@resume/contracts";
import { createId } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@resume/ui/components/dialog";
import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Group, TextField } from "../fields";
import type { Path } from "../issues";

/*
 * 여러 콘텐츠 폼이 함께 쓰는 입력 묶음: 링크 목록, 기간, 삭제 확인.
 */

/** 문구 + 주소 링크 목록 (최대 6개). 푸터와 프로젝트가 함께 쓴다. */
export function LinksGroup({
  title,
  description,
  idPrefix,
  links,
  path,
  onChange,
}: {
  title: string;
  description?: string;
  idPrefix: string;
  links: readonly Link[];
  path: Path;
  onChange: (mutate: (links: Link[]) => void) => void;
}) {
  return (
    <Group
      title={`${title} (${links.length}/6)`}
      action={
        <Button
          variant="outline"
          size="xs"
          disabled={links.length >= 6}
          onClick={() =>
            onChange((list) => {
              list.push({ id: createId(idPrefix), label: "링크", href: "https://" });
            })
          }
        >
          <Plus aria-hidden="true" /> 추가
        </Button>
      }
    >
      {description ? <p className="text-caption text-muted-foreground">{description}</p> : null}
      {links.map((link, index) => (
        <div key={link.id} className="flex items-end gap-2">
          <TextField
            className="w-28"
            label="문구"
            path={[...path, index, "label"]}
            value={link.label}
            onChange={(v) =>
              onChange((list) => {
                const t = list[index];
                if (t) t.label = v;
              })
            }
          />
          <TextField
            className="flex-1"
            label="주소"
            path={[...path, index, "href"]}
            value={link.href}
            onChange={(v) =>
              onChange((list) => {
                const t = list[index];
                if (t) t.href = v;
              })
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${link.label} 링크 삭제`}
            onClick={() =>
              onChange((list) => {
                list.splice(index, 1);
              })
            }
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
    </Group>
  );
}

/** 시작·종료 월. 종료를 비우면 "현재" */
export function PeriodFields({
  path,
  period,
  onChange,
}: {
  path: readonly (string | number)[];
  period: { start: string; end: string | null };
  onChange: (period: { start: string; end: string | null }) => void;
}): ReactNode {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="시작"
        type="month"
        path={[...path, "start"]}
        value={period.start}
        onChange={(v) => onChange({ ...period, start: v })}
      />
      <TextField
        label="종료"
        type="month"
        description="비우면 '현재'"
        path={[...path, "end"]}
        value={period.end ?? ""}
        onChange={(v) => onChange({ ...period, end: v || null })}
      />
    </div>
  );
}

/** 삭제 버튼. 사용 중인 곳이 있으면 버튼 대신 목록을 보여주고, 없으면 확인 창을 띄운다. */
export function DeleteContentButton({
  name,
  usages,
  onConfirm,
  compact = false,
}: {
  name: string;
  usages: string[];
  onConfirm: () => void;
  /** 아이콘만 있는 작은 버튼 */
  compact?: boolean;
}) {
  if (usages.length > 0) {
    return (
      <div className="flex flex-col gap-1 rounded-md bg-muted px-3 py-2 text-caption text-muted-foreground">
        <span className="font-semibold">사용 중이라 삭제할 수 없습니다.</span>
        <ul className="list-disc pl-4">
          {usages.map((usage) => (
            <li key={usage}>{usage}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive"
            aria-label={`${name} 삭제`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="self-start text-destructive">
            <Trash2 aria-hidden="true" /> 삭제
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>"{name}"을(를) 삭제할까요?</DialogTitle>
          <DialogDescription>
            초안에서만 삭제됩니다. 이전 게시 버전에는 남아 있어 복원할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
