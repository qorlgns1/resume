import type { Project } from "@resume/contracts";
import { cn } from "@resume/ui/lib/utils";
import { CoverMedia } from "../media-image";
import { ModuleLink } from "../module-link";
import { SampleBadge } from "../sample-badge";
import type { ModuleRenderProps, RenderOptions } from "../types";
import { ProjectCard } from "../views/project-card";
import { SectionHeader } from "./section-header";

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
            <ProjectCard
              project={project}
              layout={count === 1 ? "wide" : "stacked"}
              options={options}
            />
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
        <CoverMedia
          media={project.cover}
          options={options}
          frame="phone"
          sizes="(min-width: 1024px) 256px, 50vw"
          className="w-40 @md:w-44"
        />
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
