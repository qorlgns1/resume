import { Badge } from "@resume/ui/components/badge";
import { ChevronRight } from "lucide-react";
import { ModuleLink } from "../module-link";
import type { ModuleRenderProps } from "../types";

const badgeVariant = {
  neutral: "outline",
  primary: "soft",
  success: "success",
  warning: "warning",
} as const;

export function StatusModule({ module, options }: ModuleRenderProps<"status">) {
  const { props } = module;
  return (
    <div className="grid h-full gap-6 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @2xl:items-center">
      <div className="flex flex-col gap-2">
        <p className="rs-fg-subtle rs-type-body-sm font-medium">{props.eyebrow}</p>
        <h2 className="rs-type-title">{props.title}</h2>
        <div className="rs-justify flex flex-wrap items-center gap-2">
          <p className="rs-fg-muted rs-type-body-sm">{props.description}</p>
          {props.badge ? (
            <Badge variant={badgeVariant[props.badge.tone]} className="rounded-sm">
              {props.badge.label}
            </Badge>
          ) : null}
        </div>
        {props.link ? (
          <ModuleLink
            href={props.link.href}
            options={options}
            withIcon
            className="rs-accent-text mt-1 inline-flex items-center gap-1 rs-type-body-sm font-semibold underline-offset-4 hover:underline"
          >
            {props.link.label}
          </ModuleLink>
        ) : null}
      </div>
      {props.items.length > 0 ? (
        <ul className="rs-raised rs-line flex flex-col rounded-lg border p-1.5 text-start">
          {props.items.map((item) => (
            <li
              key={item.id}
              className="rs-line flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
            >
              <span className="w-16 shrink-0 rs-type-body-sm font-semibold">{item.label}</span>
              <span className="rs-fg-subtle min-w-0 flex-1 rs-type-caption">
                {item.description}
              </span>
              <ChevronRight aria-hidden="true" className="rs-fg-subtle size-4 shrink-0" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
