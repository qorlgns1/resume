import { cn } from "@resume/ui/lib/utils";
import { formatPeriod } from "../format";
import { ModuleLink } from "../module-link";
import type { ModuleRenderProps } from "../types";
import { sortCompanies } from "../views/company-views";

/** 넓은 화면에서는 표시하는 회사 수만큼 한 줄에 놓는다 */
const WIDE_COLUMNS: Record<number, string> = {
  1: "@3xl:grid-cols-1",
  2: "@3xl:grid-cols-2",
  3: "@3xl:grid-cols-3",
  4: "@3xl:grid-cols-4",
  5: "@3xl:grid-cols-5",
  6: "@3xl:grid-cols-6",
};

export function HistoryEntryModule({
  module,
  content,
  options,
}: ModuleRenderProps<"history-entry">) {
  const { props } = module;
  const companies = sortCompanies(content.companies).slice(0, props.count);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center @2xl:justify-between">
        <div className="flex flex-col gap-1 @2xl:flex-row @2xl:items-baseline @2xl:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="rs-type-title">{props.heading}</h2>
          </div>
          {props.description ? (
            <p className="rs-fg-muted rs-type-body-sm whitespace-pre-line">{props.description}</p>
          ) : null}
        </div>
        <ModuleLink
          href={props.link.href}
          options={options}
          withIcon
          className="rs-accent-text inline-flex w-fit items-center gap-1 rs-type-body-sm font-semibold underline-offset-4 hover:underline"
        >
          {props.link.label}
        </ModuleLink>
      </header>
      <ol
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-5 @3xl:gap-0",
          WIDE_COLUMNS[companies.length],
        )}
      >
        {companies.map((company) => (
          <li
            key={company.id}
            className="rs-line flex min-w-0 flex-col gap-0.5 @3xl:border-l @3xl:px-5 @3xl:first:border-l-0 @3xl:first:pl-0"
          >
            <span className="rs-type-body-sm font-bold">{company.name}</span>
            <span className="rs-fg-subtle rs-type-caption tabular-nums">
              {formatPeriod(company.period)}
            </span>
            <span className="rs-fg-muted rs-type-caption">{company.summary}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
