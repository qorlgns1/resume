import { type Project, publicPaths } from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { cn } from "@resume/ui/lib/utils";
import { Clock, Code, House, Leaf, PenLine, Sparkles } from "lucide-react";
import { projectStatusLabel } from "../format";
import { CoverMedia } from "../media-image";
import { ModuleLink } from "../module-link";
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
  const media = (
    <CoverMedia
      media={project.cover}
      options={options}
      sizes={
        layout === "wide"
          ? "(min-width: 1024px) 640px, 100vw"
          : "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
      }
    />
  );
  // 카드가 넘치지 않게 링크는 앞의 두 개만 보여준다. 전체는 상세 페이지에 있다.
  const links = project.links.slice(0, 2);
  const detailLink = (
    <ModuleLink
      href={publicPaths.project(project.slug)}
      options={options}
      withIcon
      className="ml-auto inline-flex items-center gap-1 text-body-sm font-semibold text-primary-text underline-offset-4 hover:underline"
    >
      <span className="sr-only">{project.title} </span>자세히 보기
    </ModuleLink>
  );
  return (
    <article
      className={cn(
        "@container flex h-full flex-col gap-4 rounded-xl bg-card p-5 text-card-foreground shadow-card",
        layout === "wide" && "@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] @3xl:gap-8",
      )}
    >
      <div className="flex flex-1 flex-col gap-4">
        <header className="flex items-center gap-3">
          <ProjectIcon project={project} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-title font-bold tracking-tight">{project.title}</h3>
              <ProjectStatusBadge project={project} />
            </div>
            <p className="text-body-sm text-muted-foreground">{project.tagline}</p>
          </div>
        </header>
        {layout === "wide" ? (
          <p className="text-body whitespace-pre-line text-muted-foreground">{project.summary}</p>
        ) : null}
        {layout === "stacked" ? media : null}
        {/*
         * 카드 바닥에 붙는 줄: 태그 한 줄 + 링크·자세히 보기 한 줄.
         * 링크가 없는 카드도 같은 높이를 두어, 나란한 카드끼리 줄이 맞는다.
         */}
        <div className="mt-auto flex flex-col gap-3">
          <p className="text-body-sm text-subtle-foreground">{project.tags.join(" · ")}</p>
          <div className="flex min-h-8 flex-wrap items-center gap-2">
            {links.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <li key={link.id}>
                    <ModuleLink
                      href={link.href}
                      options={options}
                      withIcon
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-body-sm font-semibold transition-colors hover:bg-accent"
                    >
                      {link.label}
                    </ModuleLink>
                  </li>
                ))}
              </ul>
            ) : null}
            {detailLink}
          </div>
        </div>
      </div>
      {layout === "wide" ? media : null}
    </article>
  );
}
