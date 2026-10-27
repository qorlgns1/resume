import { type ContentLibrary, type HistoryEntry, publicPaths } from "@resume/contracts";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Fragment } from "react";
import { formatPeriod, formatYearMonth } from "../format";
import { ModuleLink } from "../module-link";
import { keepNode, type RenderOptions, type WrapContent } from "../types";
import { EmptyList } from "./page-header";

/** 항목 아래에 놓을 링크: 외부 링크들, 또는 연결한 회사·프로젝트 페이지 */
function entryLinks(
  entry: HistoryEntry,
  content: ContentLibrary,
): { label: string; href: string }[] {
  if (entry.links) return entry.links;
  if (!entry.ref) return [];
  if (entry.ref.kind === "project") {
    const project = content.projects.find((p) => p.id === entry.ref?.id);
    return project
      ? [{ label: `프로젝트 · ${project.title}`, href: publicPaths.project(project.slug) }]
      : [];
  }
  const company = content.companies.find((c) => c.id === entry.ref?.id);
  return company
    ? [{ label: `회사 경험 · ${company.name}`, href: publicPaths.company(company.slug) }]
    : [];
}

/** 히스토리: 챕터별 타임라인 (챕터는 저장된 순서, 항목은 날짜순) */
export function HistoryTimelineView({
  content,
  options,
  wrapItem = keepNode,
  wrapChapter = keepNode,
}: {
  content: ContentLibrary;
  options: RenderOptions;
  wrapItem?: WrapContent;
  /** 챕터 카드 전체를 감싼다. 어드민 미리보기에서 순서를 끌어서 바꿀 때 사용한다. */
  wrapChapter?: WrapContent;
}) {
  const { chapters } = content.history;
  if (chapters.length === 0) return <EmptyList>아직 작성한 히스토리가 없습니다.</EmptyList>;
  return (
    <div className="flex flex-col gap-6">
      {chapters.map((chapter, index) => {
        const entries = [...chapter.entries].sort((a, b) => a.date.localeCompare(b.date));
        const headingId = `chapter-${chapter.id}`;
        return (
          <Fragment key={chapter.id}>
            {wrapChapter(
              { section: "history", itemId: chapter.id, label: chapter.title },
              <section
                aria-labelledby={headingId}
                className="grid gap-5 rounded-xl bg-card p-6 shadow-card lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 lg:p-8"
              >
                {wrapItem(
                  { section: "history", itemId: chapter.id, label: chapter.title },
                  <header className="flex flex-col gap-2">
                    <p className="text-caption font-semibold text-primary-text tabular-nums">
                      챕터 {String(index + 1).padStart(2, "0")} · {formatPeriod(chapter.period)}
                    </p>
                    <h2 id={headingId} className="text-heading font-extrabold tracking-tight">
                      {chapter.title}
                    </h2>
                    {chapter.summary ? (
                      <p className="text-body-sm whitespace-pre-line text-muted-foreground">
                        {chapter.summary}
                      </p>
                    ) : null}
                  </header>,
                )}
                {entries.length === 0 ? (
                  <p className="text-body-sm text-muted-foreground">아직 항목이 없습니다.</p>
                ) : (
                  <ol className="relative flex flex-col gap-5 border-l-2 border-border pl-6">
                    {entries.map((entry) => {
                      const links = entryLinks(entry, content);
                      return (
                        <li key={entry.id} className="relative flex flex-col gap-1">
                          <span
                            aria-hidden="true"
                            className="absolute top-1.5 -left-[1.95rem] size-3 rounded-full border-2 border-card bg-primary"
                          />
                          {wrapItem(
                            { section: "history", itemId: entry.id, label: entry.title },
                            <div className="flex flex-col gap-1">
                              <time
                                dateTime={entry.date}
                                className="text-caption font-semibold text-subtle-foreground tabular-nums"
                              >
                                {formatYearMonth(entry.date)}
                              </time>
                              <h3 className="text-title font-bold tracking-tight">{entry.title}</h3>
                              {entry.description ? (
                                <p className="text-body-sm text-muted-foreground">
                                  {entry.description}
                                </p>
                              ) : null}
                              {links.length > 0 ? (
                                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                                  {links.map((link) => (
                                    <li key={link.href}>
                                      <ModuleLink
                                        href={link.href}
                                        options={options}
                                        className="inline-flex w-fit items-center gap-1 text-body-sm font-semibold text-primary-text underline-offset-4 hover:underline"
                                      >
                                        {link.label}
                                        {/^https?:\/\//.test(link.href) ? (
                                          <ArrowUpRight aria-hidden="true" className="size-4" />
                                        ) : (
                                          <ArrowRight aria-hidden="true" className="size-4" />
                                        )}
                                      </ModuleLink>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>,
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>,
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
