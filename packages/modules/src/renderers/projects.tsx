import type { Project } from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { cn } from "@resume/ui/lib/utils";
import { Clock, Code, House, Leaf, PenLine, Sparkles } from "lucide-react";
import { projectStatusLabel } from "../format";
import { ModuleLink } from "../module-link";
import { PlaceholderMedia } from "../placeholder-media";
import { SampleBadge } from "../sample-badge";
import type { ModuleRenderProps, RenderOptions } from "../types";
import { SectionHeader } from "./section-header";

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

function pickProjects(ids: readonly string[], projects: readonly Project[]) {
  return ids.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => Boolean(p));
}

export function ProjectsModule({ module, content, options }: ModuleRenderProps<"projects">) {
  const { props } = module;

  if (props.variant === "spotlight") {
    const project = content.projects.find((p) => p.id === props.projectId);
    if (!project) return null;
    return (
      <ProjectSpotlight
        project={project}
        eyebrow={props.eyebrow}
        link={props.link}
        options={options}
      />
    );
  }

  const projects = pickProjects(props.projectIds, content.projects);
  const count = projects.length;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        heading={props.heading}
        description={props.description}
        link={props.viewAll}
        note={props.mediaNote}
        options={options}
      />
      <ul
        data-count={count}
        className={cn(
          "grid gap-3 @3xl:gap-4",
          count === 2 && "@2xl:grid-cols-2",
          count >= 3 && "@3xl:grid-cols-3",
        )}
      >
        {projects.map((project) => (
          <li key={project.id} className="min-w-0">
            <ProjectCard project={project} layout={count === 1 ? "wide" : "stacked"} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectSpotlight({
  project,
  eyebrow,
  link,
  options,
}: {
  project: Project;
  eyebrow: string;
  link?: { label: string; href: string } | undefined;
  options: RenderOptions;
}) {
  return (
    <article className="grid h-full gap-6 @md:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rs-fg-muted rs-type-body-sm">{eyebrow}</p>
          <SampleBadge show={project.isSample} />
        </div>
        <h2 className="rs-type-headline">{project.title}</h2>
        <p className="rs-fg-muted rs-type-body-lg">{project.tagline}</p>
        <p className="rs-fg-subtle rs-type-body-sm mt-auto">{project.tags.join(" · ")}</p>
      </div>
      <div className="flex flex-col items-center gap-4 @md:items-end">
        {project.cover?.kind === "placeholder" ? (
          <PlaceholderMedia
            variant="phone"
            label={project.cover.label}
            alt={project.cover.alt}
            className="w-40 @md:w-44"
          />
        ) : null}
        {link ? (
          <ModuleLink
            href={link.href}
            options={options}
            withIcon
            className="rs-fg inline-flex items-center gap-1 rs-type-body-sm font-semibold underline-offset-4 hover:underline"
          >
            {link.label}
          </ModuleLink>
        ) : null}
      </div>
    </article>
  );
}

function ProjectCard({ project, layout }: { project: Project; layout: "wide" | "stacked" }) {
  const Icon = icons[project.icon];
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
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg text-white",
              tones[project.tone],
            )}
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-title font-bold tracking-tight">{project.title}</h3>
              <Badge
                variant={project.status === "live" ? "soft" : "outline"}
                className="rounded-sm"
              >
                {projectStatusLabel[project.status]}
              </Badge>
              <SampleBadge show={project.isSample} />
            </div>
            <p className="text-body-sm text-muted-foreground">{project.tagline}</p>
          </div>
        </header>
        {layout === "wide" ? (
          <p className="text-body text-muted-foreground">{project.summary}</p>
        ) : null}
        {layout === "stacked" ? media : null}
        <p className="mt-auto text-body-sm text-subtle-foreground">{project.tags.join(" · ")}</p>
      </div>
      {layout === "wide" ? media : null}
    </article>
  );
}
