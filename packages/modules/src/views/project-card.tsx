import { type Project, publicPaths } from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { cn } from "@resume/ui/lib/utils";
import { Clock, Code, House, Leaf, PenLine, Sparkles } from "lucide-react";
import { projectStatusLabel } from "../format";
import { ModuleLink } from "../module-link";
import { PlaceholderMedia } from "../placeholder-media";
import { SampleBadge } from "../sample-badge";
import type { RenderOptions } from "../types";

const icons = {
  home: House,
  pen: PenLine,
  leaf: Leaf,
  clock: Clock,
  code: Code,
  sparkles: Sparkles,
};
const tones = {
  blue: "bg-tone-blue",
  violet: "bg-tone-violet",
  green: "bg-tone-green",
  slate: "bg-tone-slate",
};

export function ProjectIcon({ project, size = "md" }: { project: Project; size?: "md" | "lg" }) {
  const Icon = icons[project.icon];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg text-white",
        size === "lg" ? "size-14" : "size-11",
        tones[project.tone],
      )}
      aria-hidden="true"
    >
      <Icon className={size === "lg" ? "size-7" : "size-5"} />
    </span>
  );
}

export function ProjectStatusBadge({ project }: { project: Project }) {
  return (
    <Badge variant={project.status === "live" ? "soft" : "outline"} className="rounded-sm">
      {projectStatusLabel[project.status]}
    </Badge>
  );
}

/** 프로젝트 카드. 홈 모듈과 개인 프로젝트 목록이 함께 쓴다. */
export function ProjectCard({
  project,
  layout,
  options,
}: {
  project: Project;
  layout: "wide" | "stacked";
  options: RenderOptions;
}) {
  const media =
    project.cover?.kind === "placeholder" ? (
      <PlaceholderMedia label={project.cover.label} alt={project.cover.alt} />
    ) : null;
  return (
    <article
      className={cn(
        "@container flex h-full flex-col gap-4 rounded-xl bg-card p-5 text-card-foreground shadow-card",
        layout === "wide" && "@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] @3xl:gap-8",
      )}
    >
      <div className="flex flex-col gap-4">
        <header className="flex items-start gap-3">
          <ProjectIcon project={project} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-title font-bold tracking-tight">{project.title}</h3>
              <ProjectStatusBadge project={project} />
              <SampleBadge show={project.isSample} />
            </div>
            <p className="text-body-sm text-muted-foreground">{project.tagline}</p>
          </div>
        </header>
        {layout === "wide" ? (
          <p className="text-body text-muted-foreground">{project.summary}</p>
        ) : null}
        {layout === "stacked" ? media : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-sm text-subtle-foreground">{project.tags.join(" · ")}</p>
          <ModuleLink
            href={publicPaths.project(project.slug)}
            options={options}
            withIcon
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-primary-text underline-offset-4 hover:underline"
          >
            <span className="sr-only">{project.title} </span>자세히 보기
          </ModuleLink>
        </div>
      </div>
      {layout === "wide" ? media : null}
    </article>
  );
}
