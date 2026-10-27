import { type Company, type ContentLibrary, publicPaths } from "@resume/contracts";
import { ArrowRight } from "lucide-react";
import { BlockContent } from "../block-content";
import { formatPeriod } from "../format";
import { ModuleLink } from "../module-link";
import type { RenderOptions } from "../types";
import { EmptyList } from "./page-header";

/** 최근 경험이 위로 오도록 시작일 역순 */
export function sortCompanies(companies: readonly Company[]): Company[] {
  return [...companies].sort((a, b) => b.period.start.localeCompare(a.period.start));
}

/** 회사 경험 목록 */
export function CompanyListView({
  content,
  options,
}: {
  content: ContentLibrary;
  options: RenderOptions;
}) {
  if (content.companies.length === 0)
    return <EmptyList>아직 등록한 회사 경험이 없습니다.</EmptyList>;
  return (
    <ol className="flex flex-col gap-3">
      {sortCompanies(content.companies).map((company) => (
        <li key={company.id}>
          <article className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between lg:p-6">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-title font-bold tracking-tight">{company.name}</h2>
              </div>
              <p className="text-body-sm text-muted-foreground">
                {[company.role, formatPeriod(company.period)].filter(Boolean).join(" · ")}
              </p>
              {company.summary ? <p className="text-body">{company.summary}</p> : null}
              {company.tags.length > 0 ? (
                <p className="text-body-sm text-subtle-foreground">{company.tags.join(" · ")}</p>
              ) : null}
            </div>
            <ModuleLink
              href={publicPaths.company(company.slug)}
              options={options}
              className="inline-flex shrink-0 items-center gap-1 text-body-sm font-semibold text-primary-text underline-offset-4 hover:underline"
            >
              <span className="sr-only">{company.name} </span>자세히 보기
              <ArrowRight aria-hidden="true" className="size-4" />
            </ModuleLink>
          </article>
        </li>
      ))}
    </ol>
  );
}

/** 회사 경험 상세: 기본 정보 + 본문 + 관련 성과 */
export function CompanyDetailView({
  company,
  content,
  options = {},
}: {
  company: Company;
  content: ContentLibrary;
  options?: RenderOptions;
}) {
  const achievements = content.achievements.filter((a) => a.companyId === company.id);
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-xl bg-card p-6 shadow-card lg:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display-sm font-extrabold tracking-tight">{company.name}</h1>
        </div>
        <p className="text-body-lg text-muted-foreground">
          {[company.role, formatPeriod(company.period)].filter(Boolean).join(" · ")}
        </p>
        {company.summary ? <p className="text-body">{company.summary}</p> : null}
        {company.tags.length > 0 ? (
          <p className="text-body-sm text-subtle-foreground">{company.tags.join(" · ")}</p>
        ) : null}
      </div>
      <div className="rounded-xl bg-card p-6 shadow-card lg:p-8">
        {company.body.length > 0 ? (
          <BlockContent blocks={company.body} options={options} className="max-w-3xl" />
        ) : (
          <p className="text-body text-muted-foreground">아직 작성한 본문이 없습니다.</p>
        )}
      </div>
      {achievements.length > 0 ? (
        <section className="flex flex-col gap-3" aria-labelledby="company-achievements">
          <h2 id="company-achievements" className="text-heading font-extrabold tracking-tight">
            이 회사에서의 성과
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {achievements.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 rounded-xl bg-card p-5 shadow-card">
                <div className="flex items-center gap-2">
                  <h3 className="text-title font-bold tracking-tight">{a.title}</h3>
                </div>
                {a.metric ? (
                  <p className="w-fit rounded-md bg-primary-soft px-2.5 py-1 text-body-sm font-semibold text-primary-text">
                    {a.metric.label} {a.metric.before} → {a.metric.after}
                  </p>
                ) : null}
                <p className="text-body-sm whitespace-pre-line text-muted-foreground">
                  {a.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export function findCompanyBySlug(content: ContentLibrary, slug: string): Company | undefined {
  return content.companies.find((c) => c.slug === slug);
}
