import type { ContentLibrary, Project } from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { cn } from "@resume/ui/lib/utils";
import { BlockContent, blockHeadings } from "../block-content";
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
    <div className="flex flex-col gap-1.5">
      <dt className="text-caption font-semibold text-subtle-foreground">{label}</dt>
      <dd className="text-body-sm">{children}</dd>
    </div>
  );
}

/** 커버 이미지를 올려 두는 무대. 프로젝트 색을 옅게 깐다. */
const stageTones = {
  blue: "bg-tone-blue/8",
  violet: "bg-tone-violet/8",
  green: "bg-tone-green/8",
  slate: "bg-tone-slate/8",
};

/** 프로젝트 상세: 고정 메타데이터 + 노션형 본문 */
export function ProjectDetailView({
  project,
  options,
}: {
  project: Project;
  options: RenderOptions;
}) {
  const headings = blockHeadings(project.body);
  return (
    <article className="flex flex-col gap-4 lg:gap-6">
      <header className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-card lg:gap-8 lg:p-10">
        <div className="flex flex-col gap-5">
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
          {project.summary ? (
            <p className="max-w-3xl text-body-lg whitespace-pre-line">{project.summary}</p>
          ) : null}
        </div>
        {project.cover ? (
          <div className={cn("rounded-lg p-4 sm:p-6 lg:p-10", stageTones[project.tone])}>
            <CoverMedia
              media={project.cover}
              options={options}
              frame="natural"
              sizes="(min-width: 1024px) 896px, 100vw"
              className="mx-auto block max-w-[min(100%,56rem)]"
            />
          </div>
        ) : null}
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6">
        <aside className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-card lg:sticky lg:top-6 lg:order-last">
          <dl className="grid grid-cols-2 gap-5 lg:grid-cols-1">
            {project.period ? <Meta label="기간">{formatPeriod(project.period)}</Meta> : null}
            {project.links.length > 0 ? (
              <Meta label="링크">
                <span className="flex flex-col gap-1">
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
            {project.tags.length > 0 ? (
              <div className="col-span-2 lg:col-span-1">
                <Meta label="태그">
                  <ul className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <Badge variant="outline" className="rounded-sm">
                          {tag}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </Meta>
              </div>
            ) : null}
          </dl>
          {headings.length > 1 ? (
            // 모바일에서는 정보 카드가 본문 위에 오므로 목차는 넓은 화면에서만 보여준다.
            <nav
              aria-label="목차"
              className="hidden flex-col gap-2 border-t border-border pt-5 lg:flex"
            >
              <p className="text-caption font-semibold text-subtle-foreground">목차</p>
              <ol className="flex flex-col gap-1.5">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <ModuleLink
                      href={`#${heading.id}`}
                      options={options}
                      className="text-body-sm text-muted-foreground hover:text-foreground"
                    >
                      {heading.text}
                    </ModuleLink>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </aside>
        <div className="rounded-xl bg-card p-6 shadow-card lg:p-10">
          {project.body.length > 0 ? (
            <BlockContent blocks={project.body} options={options} className="max-w-[44rem]" />
          ) : (
            <p className="text-body text-muted-foreground">아직 작성한 본문이 없습니다.</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function findProjectBySlug(content: ContentLibrary, slug: string): Project | undefined {
  return content.projects.find((p) => p.slug === slug);
}
