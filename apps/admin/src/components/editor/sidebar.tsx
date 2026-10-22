"use client";

import type { Page } from "@resume/contracts";
import { getModuleCatalogEntry, moduleCatalog } from "@resume/modules";
import { Badge } from "@resume/ui/components/badge";
import { cn } from "@resume/ui/lib/utils";
import { FileText, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { NotReadyButton } from "./not-ready";

interface SidebarProps {
  pages: Page[];
  currentPage: Page;
  selectedModuleId: string | null;
  onSelectPage: (id: string) => void;
  onSelectModule: (id: string) => void;
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = `sidebar-${title}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2 px-3 py-4">
      <div className="flex items-center justify-between px-2">
        <h2 id={id} className="text-caption font-semibold text-subtle-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const itemClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-body-sm transition-colors hover:bg-accent";

export function Sidebar({
  pages,
  currentPage,
  selectedModuleId,
  onSelectPage,
  onSelectModule,
}: SidebarProps) {
  return (
    <aside
      aria-label="페이지와 모듈"
      className="min-h-0 overflow-y-auto border-r border-border bg-card"
    >
      <Section
        title="페이지"
        action={
          <NotReadyButton
            reason="페이지 추가는 준비 중입니다"
            variant="ghost"
            size="icon-xs"
            aria-label="페이지 추가"
          >
            <Plus aria-hidden="true" />
          </NotReadyButton>
        }
      >
        <ul className="flex flex-col gap-0.5">
          {pages.map((page) => {
            const current = page.id === currentPage.id;
            return (
              <li key={page.id}>
                <button
                  type="button"
                  aria-current={current ? "page" : undefined}
                  onClick={() => onSelectPage(page.id)}
                  className={cn(
                    itemClass,
                    current &&
                      "bg-primary-soft font-semibold text-primary-text hover:bg-primary-soft",
                  )}
                >
                  <FileText aria-hidden="true" className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{page.title}</span>
                  <span className="text-caption text-subtle-foreground">{page.modules.length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="이 페이지의 모듈">
        {currentPage.modules.length === 0 ? (
          <p className="px-2 text-body-sm text-subtle-foreground">아직 배치된 모듈이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {currentPage.modules.map((module) => {
              const selected = module.id === selectedModuleId;
              return (
                <li key={module.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelectModule(module.id)}
                    className={cn(
                      itemClass,
                      selected && "bg-secondary font-semibold hover:bg-secondary",
                    )}
                  >
                    <span className="flex-1 truncate">{module.label}</span>
                    <span className="text-caption text-subtle-foreground">
                      {getModuleCatalogEntry(module.type).label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section
        title="추가 가능한 모듈"
        action={
          <Badge variant="outline" className="rounded-sm">
            준비 중
          </Badge>
        }
      >
        <ul className="flex flex-col gap-1.5">
          {moduleCatalog.map((entry) => (
            <li
              key={entry.type}
              className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-sm font-semibold">{entry.label}</span>
                <span className="text-caption text-muted-foreground">{entry.description}</span>
              </span>
              <NotReadyButton
                reason="모듈 추가는 준비 중입니다"
                variant="outline"
                size="icon-xs"
                aria-label={`${entry.label} 추가`}
              >
                <Plus aria-hidden="true" />
              </NotReadyButton>
            </li>
          ))}
        </ul>
      </Section>
    </aside>
  );
}
