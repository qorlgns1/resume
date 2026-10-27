import { ModuleLink } from "../module-link";
import type { RenderOptions } from "../types";

interface SectionHeaderProps {
  heading: string;
  description?: string | undefined;
  link?: { label: string; href: string } | undefined;
  note?: string | undefined;
  options: RenderOptions;
}

/** 카드 없이 페이지 배경 위에 놓이는 섹션 제목 */
export function SectionHeader({ heading, description, link, note, options }: SectionHeaderProps) {
  return (
    <header className="flex flex-col gap-2 @2xl:flex-row @2xl:items-end @2xl:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="rs-type-heading">{heading}</h2>
        {description ? (
          <p className="rs-fg-muted rs-type-body whitespace-pre-line">{description}</p>
        ) : null}
      </div>
      {link || note ? (
        <div className="flex flex-col gap-1 @2xl:items-end">
          {link ? (
            <ModuleLink
              href={link.href}
              options={options}
              withIcon
              className="rs-accent-text inline-flex items-center gap-1 rs-type-body-sm font-semibold underline-offset-4 hover:underline"
            >
              {link.label}
            </ModuleLink>
          ) : null}
          {note ? <p className="rs-fg-subtle rs-type-caption">{note}</p> : null}
        </div>
      ) : null}
    </header>
  );
}
