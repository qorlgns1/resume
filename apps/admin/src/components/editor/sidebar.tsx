"use client";

import { publicPaths, type SiteDocument } from "@resume/contracts";
import { createModuleDraft, getModuleCatalogEntry, moduleCatalog } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@resume/ui/components/tabs";
import { cn } from "@resume/ui/lib/utils";
import { AlertCircle, FileText, Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { contentSectionLabels, createContentItem } from "./content/content-model";
import { ContentSortProvider, SortableRow } from "./content-sortable";
import { type ContentSection, useCurrentPage, useEditor } from "./editor-context";

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = `sidebar-${title.replace(/\s/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2 px-3 py-3">
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

export function Sidebar() {
  return (
    <aside
      aria-label="페이지와 콘텐츠"
      className="min-h-0 overflow-y-auto border-r border-border bg-card"
    >
      <Tabs defaultValue="pages" className="gap-0">
        <div className="px-3 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="pages">페이지</TabsTrigger>
            <TabsTrigger value="content">콘텐츠</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="pages">
          <PagesTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

/**
 * 페이지 순서를 바꾸고, 공개 사이트 메뉴도 같은 순서로 맞춘다.
 * 기본 페이지를 가리키는 메뉴 항목끼리만 자리를 바꾸고, 그 밖의 메뉴 항목은 제자리에 둔다.
 */
function movePage(document: SiteDocument, from: number, to: number) {
  const [moved] = document.pages.splice(from, 1);
  if (!moved) return;
  document.pages.splice(to, 0, moved);

  const pageHrefs: string[] = document.pages.flatMap((p) =>
    p.kind === "system" ? [publicPaths[p.systemKey]] : [],
  );
  const navigation = document.site.navigation;
  const slots = navigation.flatMap((item, index) => (pageHrefs.includes(item.href) ? [index] : []));
  const ordered = slots
    .map((index) => navigation[index])
    .filter((item) => item !== undefined)
    .sort((a, b) => pageHrefs.indexOf(a.href) - pageHrefs.indexOf(b.href));
  slots.forEach((slot, i) => {
    const item = ordered[i];
    if (item) navigation[slot] = item;
  });
}

function PagesTab() {
  const { document, edit, issues, pageId, selectPage, selection, select } = useEditor();
  const { page, pageIndex } = useCurrentPage();
  const [addError, setAddError] = useState<string | null>(null);

  const addModule = (type: (typeof moduleCatalog)[number]["type"]) => {
    const result = createModuleDraft(type, document.content);
    if (!result.ok) {
      setAddError(result.reason);
      return;
    }
    setAddError(null);
    edit((d) => {
      const target = d.pages[pageIndex];
      if (!target) return;
      const nextRow =
        Math.max(0, ...target.layout.desktop.items.map((i) => i.row + i.rowSpan - 1)) + 1;
      target.modules.push(result.module);
      target.layout.desktop.items.push({
        moduleId: result.module.id,
        col: 1,
        colSpan: 12,
        row: nextRow,
        rowSpan: 1,
      });
    });
    select({ kind: "module", moduleId: result.module.id });
  };

  return (
    <>
      <Section title="페이지">
        <ContentSortProvider
          items={document.pages.map((p) => ({ id: p.id, label: p.title }))}
          noun="페이지"
          layout="list"
          scale={1}
          onMove={(from, to) => edit((d) => movePage(d, from, to))}
        >
          <ul className="flex flex-col gap-0.5">
            {document.pages.map((p, index) => {
              const current = p.id === pageId;
              const hasIssues = issues.under(["pages", index]).length > 0;
              return (
                <li key={p.id}>
                  <SortableRow id={p.id} label={p.title}>
                    <button
                      type="button"
                      aria-current={current ? "page" : undefined}
                      onClick={() => selectPage(p.id)}
                      className={cn(
                        itemClass,
                        current &&
                          "bg-primary-soft font-semibold text-primary-text hover:bg-primary-soft",
                      )}
                    >
                      <FileText aria-hidden="true" className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{p.title}</span>
                      {hasIssues ? (
                        <AlertCircle aria-label="오류 있음" className="size-4 text-destructive" />
                      ) : null}
                      <span className="text-caption text-subtle-foreground">
                        {p.modules.length}
                      </span>
                    </button>
                  </SortableRow>
                </li>
              );
            })}
          </ul>
        </ContentSortProvider>
      </Section>

      <Section title="이 페이지의 모듈">
        {page.modules.length === 0 ? (
          <p className="px-2 text-body-sm text-subtle-foreground">
            아직 배치된 모듈이 없습니다. 아래에서 추가하세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {page.modules.map((module, index) => {
              const selected = selection?.kind === "module" && selection.moduleId === module.id;
              const hasIssues = issues.under(["pages", pageIndex, "modules", index]).length > 0;
              return (
                <li key={module.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => select({ kind: "module", moduleId: module.id })}
                    className={cn(
                      itemClass,
                      selected && "bg-secondary font-semibold hover:bg-secondary",
                    )}
                  >
                    <span className="flex-1 truncate">{module.label}</span>
                    {hasIssues ? (
                      <AlertCircle aria-label="오류 있음" className="size-4 text-destructive" />
                    ) : null}
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

      <Section title="모듈 추가">
        {addError ? (
          <p
            role="alert"
            className="mx-2 rounded-md bg-destructive-soft px-2.5 py-1.5 text-caption text-destructive"
          >
            {addError}
          </p>
        ) : null}
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
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={`${entry.label} 모듈 추가`}
                onClick={() => addModule(entry.type)}
              >
                <Plus aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

const listSections = ["projects", "companies", "achievements", "techStack"] as const;

function ContentTab() {
  const { document, edit, issues, selection, select } = useEditor();
  const add = (section: (typeof listSections)[number]) => {
    const created = createContentItem(section, document);
    edit((d) => {
      (d.content[section] as unknown[]).push(created.item);
    });
    select({ kind: "content", section, itemId: created.id });
  };
  const isSelected = (section: ContentSection, itemId?: string) =>
    selection?.kind === "content" && selection.section === section && selection.itemId === itemId;

  const single = (section: "site" | "profile" | "history" | "credentials" | "media") => {
    const hasIssues = issues.under(section === "site" ? ["site"] : ["content", section]).length > 0;
    return (
      <li key={section}>
        <button
          type="button"
          aria-pressed={isSelected(section)}
          onClick={() => select({ kind: "content", section })}
          className={cn(
            itemClass,
            isSelected(section) && "bg-secondary font-semibold hover:bg-secondary",
          )}
        >
          <span className="flex-1">{contentSectionLabels[section]}</span>
          {hasIssues ? (
            <AlertCircle aria-label="오류 있음" className="size-4 text-destructive" />
          ) : null}
        </button>
      </li>
    );
  };

  return (
    <>
      <Section title="기본 정보">
        <ul className="flex flex-col gap-0.5">
          {single("site")}
          {single("profile")}
          {single("history")}
          {single("credentials")}
          {single("media")}
        </ul>
      </Section>
      {listSections.map((section) => {
        const items = document.content[section] as readonly {
          id: string;
          title?: string;
          name?: string;
          label?: string;
        }[];
        return (
          <Section
            key={section}
            title={`${contentSectionLabels[section]} (${items.length})`}
            action={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`${contentSectionLabels[section]} 추가`}
                onClick={() => add(section)}
              >
                <Plus aria-hidden="true" />
              </Button>
            }
          >
            <ul className="flex flex-col gap-0.5">
              {items.map((item, index) => {
                const hasIssues = issues.under(["content", section, index]).length > 0;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected(section, item.id)}
                      onClick={() => select({ kind: "content", section, itemId: item.id })}
                      className={cn(
                        itemClass,
                        isSelected(section, item.id) &&
                          "bg-secondary font-semibold hover:bg-secondary",
                      )}
                    >
                      <span className="flex-1 truncate">
                        {item.title ?? item.name ?? item.label}
                      </span>
                      {hasIssues ? (
                        <AlertCircle aria-label="오류 있음" className="size-4 text-destructive" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>
        );
      })}
    </>
  );
}
