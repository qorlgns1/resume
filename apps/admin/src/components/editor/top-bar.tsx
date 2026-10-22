"use client";

import type { Page } from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { Button, buttonVariants } from "@resume/ui/components/button";
import { cn } from "@resume/ui/lib/utils";
import { ArrowUpRight, History, Monitor, Save, Send, Smartphone } from "lucide-react";
import type { PreviewViewport } from "./editor";
import { NotReadyButton } from "./not-ready";

interface TopBarProps {
  page: Page;
  viewport: PreviewViewport;
  onViewportChange: (viewport: PreviewViewport) => void;
  publicSiteUrl: string | null;
}

const viewports = [
  { value: "desktop", label: "데스크톱", detail: "1440px", Icon: Monitor },
  { value: "mobile", label: "모바일", detail: "390px", Icon: Smartphone },
] as const;

export function EditorTopBar({ page, viewport, onViewportChange, publicSiteUrl }: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <p className="font-extrabold tracking-tight">포트폴리오 어드민</p>
        <Badge variant="warning" className="rounded-sm">
          로컬 검토용
        </Badge>
        <span className="text-border-strong" aria-hidden="true">
          /
        </span>
        <h1 className="truncate text-body-sm font-semibold">{page.title}</h1>
      </div>

      <fieldset className="flex items-center gap-1 rounded-lg bg-secondary p-1">
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

      <div className="flex items-center gap-2">
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
        <NotReadyButton reason="버전 기록은 준비 중입니다" variant="ghost" size="sm">
          <History aria-hidden="true" />
          버전 기록
        </NotReadyButton>
        <NotReadyButton reason="초안 저장은 준비 중입니다" variant="outline" size="sm">
          <Save aria-hidden="true" />
          초안 저장
        </NotReadyButton>
        <NotReadyButton reason="게시는 준비 중입니다" size="sm">
          <Send aria-hidden="true" />
          게시
        </NotReadyButton>
        <span className="text-caption text-subtle-foreground">준비 중</span>
      </div>
    </header>
  );
}
