import type { ContentLibrary, Project } from "@resume/contracts";
import { BlockContent } from "../block-content";
import { formatPeriod } from "../format";
import { CoverMedia } from "../media-image";
import { ModuleLink } from "../module-link";
import type { RenderOptions } from "../types";
import { EmptyList } from "./page-header";
import { ProjectCard, ProjectIcon, ProjectStatusBadge } from "./project-card";

/** 개인 프로젝트 전체 목록 */
export function ProjectListView({
  content,
  options,
}: {
  content: ContentLibrary;
  options: RenderOptions;
}) {
  if (content.projects.length === 0) return <EmptyList>아직 등록한 프로젝트가 없습니다.</EmptyList>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {content.projects.map((project) => (
        <li key={project.id} className="min-w-0">
          <ProjectCard project={project} layout="stacked" options={options} />
        </li>
      ))}
    </ul>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption font-semibold text-subtle-foreground">{label}</dt>
      <dd className="text-body-sm">{children}</dd>
    </div>
  );
}

/** 프로젝트 상세: 고정 메타데이터 + 노션형 본문 */
export function ProjectDetailView({
  project,
  options,
}: {
  project: Project;
  options: RenderOptions;
}) {
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-card lg:p-8">
        <div className="flex items-center gap-4">
          <ProjectIcon project={project} size="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-display-sm font-extrabold tracking-tight">{project.title}</h1>
              <ProjectStatusBadge project={project} />
            </div>
            <p className="text-body-lg text-muted-foreground">{project.tagline}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
          {project.period ? <Meta label="기간">{formatPeriod(project.period)}</Meta> : null}
          {project.tags.length > 0 ? <Meta label="태그">{project.tags.join(" · ")}</Meta> : null}
          {project.links.length > 0 ? (
            <Meta label="링크">
              <span className="flex flex-wrap gap-x-3">
                {project.links.map((link) => (
                  <ModuleLink
                    key={link.id}
                    href={link.href}
                    options={options}
                    withIcon
                    className="inline-flex items-center gap-1 font-semibold text-primary-text underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </ModuleLink>
                ))}
              </span>
            </Meta>
          ) : null}
        </dl>
        {project.summary ? (
          <p className="text-body whitespace-pre-line text-muted-foreground">{project.summary}</p>
        ) : null}
        <CoverMedia
          media={project.cover}
          options={options}
          frame="natural"
          sizes="(min-width: 1024px) 768px, 100vw"
          className="max-w-3xl"
        />
      </div>
      <div className="rounded-xl bg-card p-6 shadow-card lg:p-8">
        {project.body.length > 0 ? (
          <BlockContent blocks={project.body} options={options} className="max-w-3xl" />
        ) : (
          <p className="text-body text-muted-foreground">아직 작성한 본문이 없습니다.</p>
        )}
      </div>
    </article>
  );
}

export function findProjectBySlug(content: ContentLibrary, slug: string): Project | undefined {
  return content.projects.find((p) => p.slug === slug);
}
