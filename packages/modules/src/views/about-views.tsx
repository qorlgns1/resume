import { type ContentLibrary, publicPaths } from "@resume/contracts";
import type { ReactNode } from "react";
import { BlockContent } from "../block-content";
import { formatPeriod, formatYearMonth } from "../format";
import { ModuleLink } from "../module-link";
import { keepNode, type RenderOptions, type WrapContent } from "../types";
import { sortCompanies } from "./company-views";
import { EmptyList } from "./page-header";

/*
 * 소개 페이지 본문.
 * - 왼쪽: 프로필의 소개 본문 (읽기 좋은 폭으로 제한)
 * - 오른쪽: 한눈에 보기. 회사 경험·기술·학력·자격을 이미 입력된 콘텐츠에서 뽑아 요약한다.
 *   글을 다 읽지 않아도 언제 어디서 일했는지 알 수 있게 하려는 것이다.
 *   성과는 싣지 않는다. 본문의 답 안에서 근거로 쓰이고, 홈과 회사 상세가 따로 보여 준다.
 * 좁은 화면에서는 본문 아래로 내려간다.
 */

function SummarySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-caption font-semibold tracking-wide text-subtle-foreground">{title}</h2>
      {children}
    </section>
  );
}

function AboutSummary({ content, options }: { content: ContentLibrary; options: RenderOptions }) {
  const companies = sortCompanies(content.companies);
  const { techStack, education, certifications } = content;
  if (companies.length + techStack.length + education.length + certifications.length === 0)
    return null;

  return (
    <aside
      aria-label="한눈에 보기"
      className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-card lg:sticky lg:top-6 lg:self-start"
    >
      {companies.length > 0 ? (
        <SummarySection title="경력">
          <ol className="flex flex-col gap-3">
            {companies.map((company) => (
              <li key={company.id} className="flex flex-col gap-0.5">
                <ModuleLink
                  href={publicPaths.company(company.slug)}
                  options={options}
                  className="w-fit text-body-sm font-semibold underline-offset-4 hover:underline"
                >
                  {company.name}
                </ModuleLink>
                <span className="text-caption text-muted-foreground">
                  {[formatPeriod(company.period), company.role].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ol>
        </SummarySection>
      ) : null}

      {techStack.length > 0 ? (
        <SummarySection title="기술">
          <dl className="flex flex-col gap-2">
            {techStack.map((group) => (
              <div key={group.id} className="flex flex-col gap-0.5">
                <dt className="text-caption text-muted-foreground">{group.label}</dt>
                <dd className="text-body-sm">{group.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </SummarySection>
      ) : null}

      {education.length + certifications.length > 0 ? (
        <SummarySection title="학력 · 자격">
          <ul className="flex flex-col gap-2">
            {education.map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5">
                <span className="text-body-sm">
                  {[item.school, item.major, item.degree].filter(Boolean).join(" ")}
                </span>
                <span className="text-caption text-muted-foreground">
                  {[formatPeriod(item.period), item.note].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
            {certifications.map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5">
                <span className="text-body-sm">{item.name}</span>
                <span className="text-caption text-muted-foreground">
                  {[formatYearMonth(item.date), item.issuer].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </SummarySection>
      ) : null}
    </aside>
  );
}

/** 소개 페이지 본문: 프로필의 소개 본문과, 옆에 붙는 한눈에 보기 */
export function AboutView({
  content,
  options,
  wrapItem = keepNode,
}: {
  content: ContentLibrary;
  options: RenderOptions;
  wrapItem?: WrapContent;
}) {
  const { about, name } = content.profile;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      {wrapItem(
        { section: "profile", label: `${name} 소개 본문` },
        about.length > 0 ? (
          <article className="rounded-xl bg-card p-6 shadow-card lg:p-8">
            <BlockContent blocks={about} options={options} className="max-w-3xl" />
          </article>
        ) : (
          <EmptyList>아직 작성한 소개가 없습니다.</EmptyList>
        ),
      )}
      <AboutSummary content={content} options={options} />
    </div>
  );
}
