import { buttonVariants } from "@resume/ui/components/button";
import { cn } from "@resume/ui/lib/utils";
import { ModuleLink } from "../module-link";
import { SampleBadge } from "../sample-badge";
import type { ModuleRenderProps } from "../types";

export function IntroModule({ module, content, options }: ModuleRenderProps<"intro">) {
  const { profile } = content;
  const { props } = module;

  if (props.variant === "principles") {
    return (
      <div>
        <h2 className="sr-only">일하는 방식</h2>
        <ol className="grid gap-4 @2xl:grid-cols-3 @2xl:gap-0">
          {profile.principles.map((item, index) => (
            <li
              key={item.id}
              className="rs-line flex gap-4 @2xl:border-l @2xl:px-6 @2xl:first:border-l-0 @2xl:first:pl-2"
            >
              <span className="rs-accent-text rs-type-title tabular-nums" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="rs-type-title">{item.title}</span>
                <span className="rs-fg-subtle rs-type-body-sm">{item.keywords.join(" · ")}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between gap-8">
      <div className="flex flex-col gap-5">
        <div className="rs-justify flex flex-wrap items-center gap-2">
          {profile.roleEyebrow ? (
            <p className="rs-accent-text rs-type-eyebrow">{profile.roleEyebrow}</p>
          ) : null}
          <SampleBadge show={profile.isSample} />
        </div>
        <h1 className="rs-type-display whitespace-pre-line">{profile.headline}</h1>
        <div className="flex flex-col gap-2">
          <p className="rs-fg-muted rs-type-body-lg">{profile.summary}</p>
          {props.showName ? (
            <p className="rs-fg-muted rs-type-body-sm font-medium">{profile.name}</p>
          ) : null}
        </div>
      </div>
      {props.actions.length > 0 ? (
        <ul className="rs-justify flex flex-wrap gap-2">
          {props.actions.map((action) => (
            <li key={action.id}>
              <ModuleLink
                href={action.href}
                options={options}
                withIcon
                className={cn(
                  buttonVariants({
                    variant: action.emphasis === "primary" ? "default" : "outline",
                    size: "lg",
                  }),
                  action.emphasis === "secondary" && "border-border-strong",
                )}
              >
                {action.label}
              </ModuleLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
