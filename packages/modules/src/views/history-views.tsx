import { type ContentLibrary, type HistoryEntry, publicPaths } from "@resume/contracts";
import { ArrowRight } from "lucide-react";
import { formatPeriod, formatYearMonth } from "../format";
import { ModuleLink } from "../module-link";
import type { RenderOptions } from "../types";
import { EmptyList } from "./page-header";

function refLink(
  entry: HistoryEntry,
  content: ContentLibrary,
): { label: string; href: string } | null {
  if (!entry.ref) return null;
  if (entry.ref.kind === "project") {
    const project = content.projects.find((p) => p.id === entry.ref?.id);
    return project
      ? { label: `프로젝트 · ${project.title}`, href: publicPaths.project(project.slug) }
      : null;
  }
  const company = content.companies.find((c) => c.id === entry.ref?.id);
  return company
    ? { label: `회사 경험 · ${company.name}`, href: publicPaths.company(company.slug) }
    : null;
}

/** 히스토리: 챕터별 타임라인 (챕터는 저장된 순서, 항목은 날짜순) */
export function HistoryTimelineView({
  content,
  options,
}: {
  content: ContentLibrary;
  options: RenderOptions;
}) {
  const { chapters } = content.history;
  if (chapters.length === 0) return <EmptyList>아직 작성한 히스토리가 없습니다.</EmptyList>;
  return (
    <div className="flex flex-col gap-6">
      {chapters.map((chapter, index) => {
        const entries = [...chapter.entries].sort((a, b) => a.date.localeCompare(b.date));
        const headingId = `chapter-${chapter.id}`;
        return (
          <section
            key={chapter.id}
            aria-labelledby={headingId}
            className="grid gap-5 rounded-xl bg-card p-6 shadow-card lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 lg:p-8"
          >
            <header className="flex flex-col gap-2">
              <p className="text-caption font-semibold text-primary-text tabular-nums">
                챕터 {String(index + 1).padStart(2, "0")} · {formatPeriod(chapter.period)}
              </p>
              <h2 id={headingId} className="text-heading font-extrabold tracking-tight">
                {chapter.title}
              </h2>
              {chapter.summary ? (
                <p className="text-body-sm text-muted-foreground">{chapter.summary}</p>
              ) : null}
            </header>
            {entries.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">아직 항목이 없습니다.</p>
            ) : (
              <ol className="relative flex flex-col gap-5 border-l-2 border-border pl-6">
                {entries.map((entry) => {
                  const link = refLink(entry, content);
                  return (
                    <li key={entry.id} className="relative flex flex-col gap-1">
                      <span
                        aria-hidden="true"
                        className="absolute top-1.5 -left-[1.95rem] size-3 rounded-full border-2 border-card bg-primary"
                      />
                      <time
                        dateTime={entry.date}
                        className="text-caption font-semibold text-subtle-foreground tabular-nums"
                      >
                        {formatYearMonth(entry.date)}
                      </time>
                      <h3 className="text-title font-bold tracking-tight">{entry.title}</h3>
                      {entry.description ? (
                        <p className="text-body-sm text-muted-foreground">{entry.description}</p>
                      ) : null}
                      {link ? (
                        <ModuleLink
                          href={link.href}
                          options={options}
                          className="inline-flex w-fit items-center gap-1 text-body-sm font-semibold text-primary-text underline-offset-4 hover:underline"
                        >
                          {link.label}
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </ModuleLink>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
