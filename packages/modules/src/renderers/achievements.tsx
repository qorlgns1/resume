import type { Achievement } from "@resume/contracts";
import { cn } from "@resume/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import type { ModuleRenderProps } from "../types";
import { SectionHeader } from "./section-header";

export function AchievementsModule({
  module,
  content,
  options,
}: ModuleRenderProps<"achievements">) {
  const { props } = module;
  const items = props.achievementIds
    .map((id) => content.achievements.find((a) => a.id === id))
    .filter((a): a is Achievement => Boolean(a));

  return (
    <div className="rs-section flex flex-col gap-5">
      <SectionHeader heading={props.heading} description={props.description} options={options} />
      <ul className={cn("grid gap-3 @3xl:gap-4", items.length > 1 && "@2xl:grid-cols-2")}>
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <article className="flex h-full flex-col gap-3 rounded-xl bg-card p-5 text-card-foreground shadow-card @3xl:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-caption text-subtle-foreground">{item.context.join(" · ")}</p>
              </div>
              <h3 className="text-title font-bold tracking-tight">{item.title}</h3>
              {item.metric ? (
                <p className="inline-flex w-fit flex-wrap items-center gap-1.5 rounded-md bg-primary-soft px-2.5 py-1 text-body-sm font-semibold text-primary-text">
                  <span>{item.metric.label}</span>
                  <span>{item.metric.before}</span>
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">에서</span>
                  <span>{item.metric.after}</span>
                </p>
              ) : null}
              <p className="text-body-sm whitespace-pre-line text-muted-foreground">
                {item.description}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
