"use client";

import {
  type Achievement,
  type Company,
  collectModuleReferences,
  type HistoryChapter,
  type Link,
  MAX_HISTORY_ENTRY_LINKS,
  type Project,
  type ProjectIconKey,
  type ProjectTone,
  type SiteDocument,
  type TechStackGroup,
} from "@resume/contracts";
import { createId, projectIconLabel, projectToneLabel } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@resume/ui/components/dialog";
import { FieldGroup } from "@resume/ui/components/field";
import { cn } from "@resume/ui/lib/utils";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { BodyEditor } from "./body-editor";
import { CoverField } from "./cover-field";
import { type ContentSection, useEditor } from "./editor-context";
import { CommaListField, Group, SelectField, TextField } from "./fields";
import type { Path } from "./issues";
import { LogoField } from "./logo-field";
import { MediaLibraryPanel } from "./media-settings";

/*
 * 원본 콘텐츠 편집. 여기서 고친 내용은 이 콘텐츠를 참조하는 모든 페이지·모듈에 반영된다.
 */

export const contentSectionLabels: Record<ContentSection, string> = {
  site: "사이트 정보",
  profile: "프로필",
  projects: "프로젝트",
  companies: "회사",
  achievements: "성과",
  techStack: "기술 스택",
  history: "히스토리",
  media: "미디어",
};

export type ListSection = "projects" | "companies" | "achievements" | "techStack";

/** 이 콘텐츠를 쓰는 곳. 쓰는 곳이 있으면 삭제를 막는다. */
export function findContentUsages(
  document: SiteDocument,
  section: ListSection,
  id: string,
): string[] {
  const kind = {
    projects: "project",
    companies: "company",
    achievements: "achievement",
    techStack: "tech-stack",
  }[section];
  const usages: string[] = [];
  for (const page of document.pages) {
    for (const module of page.modules) {
      if (collectModuleReferences(module).some((ref) => ref.kind === kind && ref.id === id)) {
        usages.push(`${page.title} 페이지의 "${module.label}" 모듈`);
      }
    }
  }
  for (const achievement of document.content.achievements) {
    if (achievement.companyId === id || achievement.projectId === id)
      usages.push(`성과 "${achievement.title}"`);
  }
  for (const chapter of document.content.history.chapters) {
    for (const entry of chapter.entries) {
      if (entry.ref?.id === id) usages.push(`히스토리 "${chapter.title}"의 "${entry.title}"`);
    }
  }
  return usages;
}

function uniqueSlug(base: string, taken: readonly string[]): string {
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** 새 원본 콘텐츠 항목의 기본값 */
export function createContentItem(
  section: ListSection,
  document: SiteDocument,
): { id: string; item: unknown } {
  switch (section) {
    case "projects": {
      const id = createId("prj");
      const project: Project = {
        id,
        slug: uniqueSlug(
          "new-project",
          document.content.projects.map((p) => p.slug),
        ),
        kind: "personal",
        title: "새 프로젝트",
        tagline: "",
        summary: "",
        status: "in-development",
        icon: "code",
        tone: "slate",
        tags: [],
        links: [],
        body: [],
      };
      return { id, item: project };
    }
    case "companies": {
      const id = createId("co");
      const now = new Date();
      const company: Company = {
        id,
        slug: uniqueSlug(
          "new-company",
          document.content.companies.map((c) => c.slug),
        ),
        name: "새 회사",
        role: "",
        period: {
          start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          end: null,
        },
        summary: "",
        tags: [],
        body: [],
      };
      return { id, item: company };
    }
    case "achievements": {
      const id = createId("ach");
      const achievement: Achievement = { id, context: [], title: "새 성과", description: "" };
      return { id, item: achievement };
    }
    case "techStack": {
      const id = createId("ts");
      const group: TechStackGroup = { id, label: "새 분류", items: ["기술"] };
      return { id, item: group };
    }
  }
}

export function ContentSettings({ section, itemId }: { section: ContentSection; itemId?: string }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-title font-bold tracking-tight">{contentSectionLabels[section]}</h2>
        <p className="text-caption text-muted-foreground">
          {section === "media"
            ? "업로드한 이미지입니다. 초안이나 게시 버전에서 쓰는 이미지는 삭제할 수 없습니다."
            : "원본 콘텐츠입니다. 이 내용을 쓰는 모든 페이지와 모듈에 함께 반영됩니다."}
        </p>
      </header>
      {section === "site" ? <SiteForm /> : null}
      {section === "profile" ? <ProfileForm /> : null}
      {section === "history" ? <HistoryForm itemId={itemId} /> : null}
      {section === "media" ? <MediaLibraryPanel /> : null}
      {section !== "site" &&
      section !== "profile" &&
      section !== "history" &&
      section !== "media" ? (
        <ListItemForm section={section} itemId={itemId} />
      ) : null}
    </div>
  );
}

function SiteForm() {
  const { document, edit } = useEditor();
  const site = document.site;
  return (
    <FieldGroup className="gap-4">
      <TextField
        label="사이트 제목"
        description="브라우저 탭과 검색 결과에 보입니다."
        path={["site", "title"]}
        value={site.title}
        onChange={(v) =>
          edit((d) => {
            d.site.title = v;
          })
        }
      />
      <TextField
        label="사이트 설명"
        path={["site", "description"]}
        value={site.description}
        multiline
        onChange={(v) =>
          edit((d) => {
            d.site.description = v;
          })
        }
      />
      <LogoField
        logo={site.logo}
        name={document.content.profile.name}
        onChange={(logo) =>
          edit((d) => {
            d.site.logo = logo;
          })
        }
      />
      <TextField
        label="푸터 안내 문구"
        path={["site", "footer", "note"]}
        value={site.footer.note ?? ""}
        onChange={(v) =>
          edit((d) => {
            d.site.footer.note = v.trim() ? v : undefined;
          })
        }
      />
      <LinksGroup
        title="푸터 링크"
        idPrefix="foot"
        links={site.footer.links}
        path={["site", "footer", "links"]}
        onChange={(mutate) =>
          edit((d) => {
            mutate(d.site.footer.links);
          })
        }
      />
      <p className="text-caption text-muted-foreground">
        메뉴 구성은 기본 페이지로 고정되어 있습니다. 사용자 페이지를 추가하는 단계에서 편집할 수
        있게 됩니다.
      </p>
    </FieldGroup>
  );
}

const iconOptions = (Object.keys(projectIconLabel) as ProjectIconKey[]).map((value) => ({
  value,
  label: projectIconLabel[value],
}));
const toneOptions = (Object.keys(projectToneLabel) as ProjectTone[]).map((value) => ({
  value,
  label: projectToneLabel[value],
}));

/** 문구 + 주소 링크 목록 (최대 6개). 푸터와 프로젝트가 함께 쓴다. */
function LinksGroup({
  title,
  description,
  idPrefix,
  links,
  path,
  onChange,
}: {
  title: string;
  description?: string;
  idPrefix: string;
  links: readonly Link[];
  path: Path;
  onChange: (mutate: (links: Link[]) => void) => void;
}) {
  return (
    <Group
      title={`${title} (${links.length}/6)`}
      action={
        <Button
          variant="outline"
          size="xs"
          disabled={links.length >= 6}
          onClick={() =>
            onChange((list) => {
              list.push({ id: createId(idPrefix), label: "링크", href: "https://" });
            })
          }
        >
          <Plus aria-hidden="true" /> 추가
        </Button>
      }
    >
      {description ? <p className="text-caption text-muted-foreground">{description}</p> : null}
      {links.map((link, index) => (
        <div key={link.id} className="flex items-end gap-2">
          <TextField
            className="w-28"
            label="문구"
            path={[...path, index, "label"]}
            value={link.label}
            onChange={(v) =>
              onChange((list) => {
                const t = list[index];
                if (t) t.label = v;
              })
            }
          />
          <TextField
            className="flex-1"
            label="주소"
            path={[...path, index, "href"]}
            value={link.href}
            onChange={(v) =>
              onChange((list) => {
                const t = list[index];
                if (t) t.href = v;
              })
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${link.label} 링크 삭제`}
            onClick={() =>
              onChange((list) => {
                list.splice(index, 1);
              })
            }
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
    </Group>
  );
}

function ProfileForm() {
  const { document, edit } = useEditor();
  const profile = document.content.profile;
  const path = ["content", "profile"] as const;
  return (
    <FieldGroup className="gap-4">
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="이름"
          path={[...path, "name"]}
          value={profile.name}
          onChange={(v) =>
            edit((d) => {
              d.content.profile.name = v;
            })
          }
        />
        <TextField
          label="직무"
          path={[...path, "role"]}
          value={profile.role}
          onChange={(v) =>
            edit((d) => {
              d.content.profile.role = v;
            })
          }
        />
      </div>
      <TextField
        label="영문 직무 (보조 제목)"
        path={[...path, "roleEyebrow"]}
        value={profile.roleEyebrow ?? ""}
        onChange={(v) =>
          edit((d) => {
            d.content.profile.roleEyebrow = v.trim() ? v : undefined;
          })
        }
      />
      <TextField
        label="대표 문구"
        description="줄을 바꾸면 화면에서도 줄이 바뀝니다."
        path={[...path, "headline"]}
        value={profile.headline}
        multiline
        onChange={(v) =>
          edit((d) => {
            d.content.profile.headline = v;
          })
        }
      />
      <TextField
        label="소개"
        path={[...path, "summary"]}
        value={profile.summary}
        multiline
        onChange={(v) =>
          edit((d) => {
            d.content.profile.summary = v;
          })
        }
      />
      <Group
        title={`일하는 방식 (${profile.principles.length}/4)`}
        action={
          <Button
            variant="outline"
            size="xs"
            disabled={profile.principles.length >= 4}
            onClick={() =>
              edit((d) => {
                d.content.profile.principles.push({
                  id: createId("pr"),
                  title: "새 항목",
                  keywords: [],
                });
              })
            }
          >
            <Plus aria-hidden="true" /> 추가
          </Button>
        }
      >
        {profile.principles.map((principle, index) => (
          <div key={principle.id} className="flex items-end gap-2">
            <TextField
              className="flex-1"
              label="제목"
              path={[...path, "principles", index, "title"]}
              value={principle.title}
              onChange={(v) =>
                edit((d) => {
                  const t = d.content.profile.principles[index];
                  if (t) t.title = v;
                })
              }
            />
            <CommaListField
              className="flex-1"
              label="키워드"
              description=""
              path={[...path, "principles", index, "keywords"]}
              value={principle.keywords}
              onChange={(v) =>
                edit((d) => {
                  const t = d.content.profile.principles[index];
                  if (t) t.keywords = v;
                })
              }
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${principle.title} 삭제`}
              onClick={() =>
                edit((d) => {
                  d.content.profile.principles.splice(index, 1);
                })
              }
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
      </Group>
    </FieldGroup>
  );
}

function ListItemForm({ section, itemId }: { section: ListSection; itemId?: string }) {
  const { document, edit, select } = useEditor();
  const list = document.content[section] as readonly { id: string }[];
  const index = list.findIndex((item) => item.id === itemId);
  const item = list[index];

  const add = () => {
    const created = createContentItem(section, document);
    edit((d) => {
      (d.content[section] as unknown[]).push(created.item);
    });
    select({ kind: "content", section, itemId: created.id });
  };

  const addButton = (
    <Button variant="outline" size="sm" onClick={add}>
      <Plus aria-hidden="true" /> {contentSectionLabels[section]} 추가
    </Button>
  );

  if (!item) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body-sm text-muted-foreground">
          왼쪽 목록에서 항목을 고르거나 새로 추가하세요.
        </p>
        {addButton}
      </div>
    );
  }

  const usages = findContentUsages(document, section, item.id);
  const remove = () => {
    edit((d) => {
      (d.content[section] as { id: string }[]).splice(index, 1);
    });
    select({ kind: "content", section });
  };

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        {section === "projects" ? <ProjectFields index={index} project={item as Project} /> : null}
        {section === "companies" ? <CompanyFields index={index} company={item as Company} /> : null}
        {section === "achievements" ? (
          <AchievementFields index={index} achievement={item as Achievement} />
        ) : null}
        {section === "techStack" ? (
          <TechStackFields index={index} group={item as TechStackGroup} />
        ) : null}
      </FieldGroup>
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <DeleteContentButton
          name={
            (item as { title?: string; name?: string; label?: string }).title ??
            (item as Company).name ??
            (item as TechStackGroup).label
          }
          usages={usages}
          onConfirm={remove}
        />
        {addButton}
      </div>
    </div>
  );
}

function DeleteContentButton({
  name,
  usages,
  onConfirm,
  compact = false,
}: {
  name: string;
  usages: string[];
  onConfirm: () => void;
  /** 아이콘만 있는 작은 버튼 */
  compact?: boolean;
}) {
  if (usages.length > 0) {
    return (
      <div className="flex flex-col gap-1 rounded-md bg-muted px-3 py-2 text-caption text-muted-foreground">
        <span className="font-semibold">사용 중이라 삭제할 수 없습니다.</span>
        <ul className="list-disc pl-4">
          {usages.map((usage) => (
            <li key={usage}>{usage}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive"
            aria-label={`${name} 삭제`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="self-start text-destructive">
            <Trash2 aria-hidden="true" /> 삭제
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>"{name}"을(를) 삭제할까요?</DialogTitle>
          <DialogDescription>
            초안에서만 삭제됩니다. 이전 게시 버전에는 남아 있어 복원할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PeriodFields({
  path,
  period,
  onChange,
}: {
  path: readonly (string | number)[];
  period: { start: string; end: string | null };
  onChange: (period: { start: string; end: string | null }) => void;
}): ReactNode {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="시작"
        type="month"
        path={[...path, "start"]}
        value={period.start}
        onChange={(v) => onChange({ ...period, start: v })}
      />
      <TextField
        label="종료"
        type="month"
        description="비우면 '현재'"
        path={[...path, "end"]}
        value={period.end ?? ""}
        onChange={(v) => onChange({ ...period, end: v || null })}
      />
    </div>
  );
}

function ProjectFields({ index, project }: { index: number; project: Project }) {
  const { edit } = useEditor();
  const path = ["content", "projects", index] as const;
  const set = (mutate: (p: Project) => void) =>
    edit((d) => {
      const target = d.content.projects[index];
      if (target) mutate(target);
    });
  return (
    <>
      <TextField
        label="이름"
        path={[...path, "title"]}
        value={project.title}
        onChange={(v) =>
          set((p) => {
            p.title = v;
          })
        }
      />
      <TextField
        label="주소용 이름 (slug)"
        description="상세 페이지 주소에 쓰입니다. 예: my-app"
        path={[...path, "slug"]}
        value={project.slug}
        onChange={(v) =>
          set((p) => {
            p.slug = v;
          })
        }
      />
      <TextField
        label="한 줄 소개"
        path={[...path, "tagline"]}
        value={project.tagline}
        onChange={(v) =>
          set((p) => {
            p.tagline = v;
          })
        }
      />
      <TextField
        label="요약"
        path={[...path, "summary"]}
        value={project.summary}
        multiline
        onChange={(v) =>
          set((p) => {
            p.summary = v;
          })
        }
      />
      <div className="grid grid-cols-3 gap-2">
        <SelectField
          label="상태"
          path={[...path, "status"]}
          value={project.status}
          options={[
            { value: "live", label: "운영 중" },
            { value: "in-development", label: "개발 중" },
            { value: "paused", label: "일시 중단" },
            { value: "archived", label: "종료" },
          ]}
          onChange={(v) =>
            set((p) => {
              p.status = v;
            })
          }
        />
        <SelectField
          label="아이콘"
          path={[...path, "icon"]}
          value={project.icon}
          options={iconOptions}
          onChange={(v) =>
            set((p) => {
              p.icon = v;
            })
          }
        />
        <SelectField
          label="색"
          path={[...path, "tone"]}
          value={project.tone}
          options={toneOptions}
          onChange={(v) =>
            set((p) => {
              p.tone = v;
            })
          }
        />
      </div>
      <CommaListField
        label="태그"
        path={[...path, "tags"]}
        value={project.tags}
        placeholder="iOS, 1인 개발"
        onChange={(v) =>
          set((p) => {
            p.tags = v;
          })
        }
      />
      <LinksGroup
        title="링크"
        description="App Store, GitHub처럼 바깥 주소는 새 탭에서 열립니다. 카드에는 앞의 두 개가 보입니다."
        idPrefix="link"
        links={project.links}
        path={[...path, "links"]}
        onChange={(mutate) =>
          set((p) => {
            mutate(p.links);
          })
        }
      />
      {project.period ? (
        <PeriodFields
          path={[...path, "period"]}
          period={project.period}
          onChange={(period) =>
            set((p) => {
              p.period = period;
            })
          }
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            set((p) => {
              const now = new Date();
              p.period = {
                start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
                end: null,
              };
            })
          }
        >
          기간 추가
        </Button>
      )}
      <CoverField
        cover={project.cover}
        path={[...path, "cover"]}
        onChange={(cover) =>
          set((p) => {
            p.cover = cover;
          })
        }
      />
      <BodyEditor
        title={project.title}
        body={project.body}
        path={[...path, "body"]}
        onChange={(blocks) =>
          set((p) => {
            p.body = blocks;
          })
        }
      />
    </>
  );
}

function CompanyFields({ index, company }: { index: number; company: Company }) {
  const { edit } = useEditor();
  const path = ["content", "companies", index] as const;
  const set = (mutate: (c: Company) => void) =>
    edit((d) => {
      const target = d.content.companies[index];
      if (target) mutate(target);
    });
  return (
    <>
      <TextField
        label="회사 이름"
        path={[...path, "name"]}
        value={company.name}
        onChange={(v) =>
          set((c) => {
            c.name = v;
          })
        }
      />
      <TextField
        label="주소용 이름 (slug)"
        path={[...path, "slug"]}
        value={company.slug}
        onChange={(v) =>
          set((c) => {
            c.slug = v;
          })
        }
      />
      <TextField
        label="역할"
        path={[...path, "role"]}
        value={company.role}
        onChange={(v) =>
          set((c) => {
            c.role = v;
          })
        }
      />
      <PeriodFields
        path={[...path, "period"]}
        period={company.period}
        onChange={(period) =>
          set((c) => {
            c.period = period;
          })
        }
      />
      <TextField
        label="한 줄 설명"
        path={[...path, "summary"]}
        value={company.summary}
        onChange={(v) =>
          set((c) => {
            c.summary = v;
          })
        }
      />
      <CommaListField
        label="태그"
        path={[...path, "tags"]}
        value={company.tags}
        onChange={(v) =>
          set((c) => {
            c.tags = v;
          })
        }
      />
      <BodyEditor
        title={company.name}
        body={company.body}
        path={[...path, "body"]}
        onChange={(blocks) =>
          set((c) => {
            c.body = blocks;
          })
        }
      />
    </>
  );
}

const NONE = "__none";

function AchievementFields({ index, achievement }: { index: number; achievement: Achievement }) {
  const { document, edit } = useEditor();
  const path = ["content", "achievements", index] as const;
  const set = (mutate: (a: Achievement) => void) =>
    edit((d) => {
      const target = d.content.achievements[index];
      if (target) mutate(target);
    });
  const metric = achievement.metric;
  return (
    <>
      <TextField
        label="제목"
        path={[...path, "title"]}
        value={achievement.title}
        onChange={(v) =>
          set((a) => {
            a.title = v;
          })
        }
      />
      <CommaListField
        label="분류"
        description="쉼표로 구분합니다. 최대 3개"
        path={[...path, "context"]}
        value={achievement.context}
        placeholder="회사 이름, 품질 개선"
        onChange={(v) =>
          set((a) => {
            a.context = v;
          })
        }
      />
      <TextField
        label="설명"
        path={[...path, "description"]}
        value={achievement.description}
        multiline
        onChange={(v) =>
          set((a) => {
            a.description = v;
          })
        }
      />
      <Group title="지표 변화 (선택)">
        <div className="grid grid-cols-3 gap-2">
          {(["label", "before", "after"] as const).map((key) => (
            <TextField
              key={key}
              label={{ label: "지표 이름", before: "이전", after: "이후" }[key]}
              path={[...path, "metric", key]}
              value={metric?.[key] ?? ""}
              onChange={(v) =>
                set((a) => {
                  const next = { label: "", before: "", after: "", ...a.metric, [key]: v };
                  a.metric = next.label || next.before || next.after ? next : undefined;
                })
              }
            />
          ))}
        </div>
      </Group>
      <SelectField
        label="관련 회사"
        path={[...path, "companyId"]}
        value={achievement.companyId ?? NONE}
        options={[
          { value: NONE, label: "없음" },
          ...document.content.companies.map((c) => ({ value: c.id, label: c.name })),
        ]}
        onChange={(v) =>
          set((a) => {
            a.companyId = v === NONE ? undefined : v;
          })
        }
      />
    </>
  );
}

function TechStackFields({ index, group }: { index: number; group: TechStackGroup }) {
  const { edit } = useEditor();
  const path = ["content", "techStack", index] as const;
  return (
    <>
      <TextField
        label="분류 이름"
        path={[...path, "label"]}
        value={group.label}
        onChange={(v) =>
          edit((d) => {
            const t = d.content.techStack[index];
            if (t) t.label = v;
          })
        }
      />
      <CommaListField
        label="기술"
        path={[...path, "items"]}
        value={group.items}
        placeholder="TypeScript, React"
        onChange={(v) =>
          edit((d) => {
            const t = d.content.techStack[index];
            if (t) t.items = v;
          })
        }
      />
    </>
  );
}

const NO_REF = "__none";
const EXTERNAL_LINK = "__link";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 이번 달에 시작하는 빈 챕터 */
export function newHistoryChapter(): HistoryChapter {
  return {
    id: createId("ch"),
    title: "새 챕터",
    summary: "",
    period: { start: currentYearMonth(), end: null },
    entries: [],
  };
}

/** 히스토리: 챕터 + 타임라인. 항목은 회사·프로젝트를 연결하거나 직접 쓴다. 공개 화면은 날짜순으로 정렬한다. */
function HistoryForm({ itemId }: { itemId?: string }) {
  const { document, edit } = useEditor();
  const { chapters } = document.content.history;
  const formRef = useRef<HTMLDivElement>(null);

  // 미리보기에서 고른 챕터·항목이 보이도록 설정 패널을 옮긴다.
  useEffect(() => {
    if (!itemId) return;
    formRef.current
      ?.querySelector(`[data-item-id="${CSS.escape(itemId)}"]`)
      ?.scrollIntoView({ block: "start" });
  }, [itemId]);
  const refOptions = [
    { value: NO_REF, label: "연결 없음 (직접 작성)" },
    { value: EXTERNAL_LINK, label: "외부 링크 (GitHub, 수료증, 글 등)" },
    ...document.content.projects.map((p) => ({
      value: `project:${p.id}`,
      label: `프로젝트 · ${p.title}`,
    })),
    ...document.content.companies.map((c) => ({
      value: `company:${c.id}`,
      label: `회사 · ${c.name}`,
    })),
  ];

  const editChapter = (index: number, mutate: (chapter: (typeof chapters)[number]) => void) =>
    edit((d) => {
      const target = d.content.history.chapters[index];
      if (target) mutate(target);
    });

  const moveChapter = (index: number, delta: -1 | 1) =>
    edit((d) => {
      const list = d.content.history.chapters;
      const [item] = list.splice(index, 1);
      if (item) list.splice(index + delta, 0, item);
    });

  return (
    <div ref={formRef} className="flex flex-col gap-4">
      <p className="text-caption text-muted-foreground">
        챕터는 이 순서대로, 각 챕터의 항목은 날짜순으로 공개 사이트에 표시됩니다.
      </p>
      {chapters.map((chapter, ci) => {
        const path = ["content", "history", "chapters", ci] as const;
        return (
          <Group
            key={chapter.id}
            title={`챕터 ${ci + 1}`}
            itemKey={chapter.id}
            className={cn("scroll-mt-4", chapter.id === itemId && "border-primary")}
            action={
              <span className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${chapter.title} 위로`}
                  disabled={ci === 0}
                  onClick={() => moveChapter(ci, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${chapter.title} 아래로`}
                  disabled={ci === chapters.length - 1}
                  onClick={() => moveChapter(ci, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
                <DeleteContentButton
                  name={chapter.title}
                  usages={[]}
                  compact
                  onConfirm={() =>
                    edit((d) => {
                      d.content.history.chapters.splice(ci, 1);
                    })
                  }
                />
              </span>
            }
          >
            <TextField
              label="챕터 제목"
              path={[...path, "title"]}
              value={chapter.title}
              onChange={(v) =>
                editChapter(ci, (c) => {
                  c.title = v;
                })
              }
            />
            <TextField
              label="요약"
              path={[...path, "summary"]}
              value={chapter.summary}
              multiline
              onChange={(v) =>
                editChapter(ci, (c) => {
                  c.summary = v;
                })
              }
            />
            <PeriodFields
              path={[...path, "period"]}
              period={chapter.period}
              onChange={(period) =>
                editChapter(ci, (c) => {
                  c.period = period;
                })
              }
            />
            <div className="flex flex-col gap-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-caption font-semibold text-muted-foreground">
                  항목 ({chapter.entries.length})
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    editChapter(ci, (c) => {
                      c.entries.push({
                        id: createId("he"),
                        date: currentYearMonth(),
                        title: "새 항목",
                      });
                    })
                  }
                >
                  <Plus aria-hidden="true" /> 항목 추가
                </Button>
              </div>
              {chapter.entries.map((entry, ei) => {
                const entryPath = [...path, "entries", ei] as const;
                const setEntry = (mutate: (e: (typeof chapter.entries)[number]) => void) =>
                  editChapter(ci, (c) => {
                    const target = c.entries[ei];
                    if (target) mutate(target);
                  });
                return (
                  <div
                    key={entry.id}
                    data-item-id={entry.id}
                    className={cn(
                      "flex scroll-mt-4 flex-col gap-2 rounded-md bg-muted p-2.5",
                      entry.id === itemId && "ring-2 ring-primary",
                    )}
                  >
                    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)_auto] items-end gap-2">
                      <TextField
                        label="날짜"
                        type="month"
                        path={[...entryPath, "date"]}
                        value={entry.date}
                        onChange={(v) =>
                          setEntry((e) => {
                            e.date = v;
                          })
                        }
                      />
                      <TextField
                        label="제목"
                        path={[...entryPath, "title"]}
                        value={entry.title}
                        onChange={(v) =>
                          setEntry((e) => {
                            e.title = v;
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${entry.title} 항목 삭제`}
                        onClick={() =>
                          editChapter(ci, (c) => {
                            c.entries.splice(ei, 1);
                          })
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                    <TextField
                      label="설명 (선택)"
                      path={[...entryPath, "description"]}
                      value={entry.description ?? ""}
                      onChange={(v) =>
                        setEntry((e) => {
                          e.description = v.trim() ? v : undefined;
                        })
                      }
                    />
                    <SelectField
                      label="연결"
                      path={[...entryPath, "ref"]}
                      value={
                        entry.ref
                          ? `${entry.ref.kind}:${entry.ref.id}`
                          : entry.links
                            ? EXTERNAL_LINK
                            : NO_REF
                      }
                      options={refOptions}
                      onChange={(v) =>
                        setEntry((e) => {
                          delete e.ref;
                          if (v !== EXTERNAL_LINK) delete e.links;
                          if (v === NO_REF) return;
                          if (v === EXTERNAL_LINK) {
                            e.links ??= [{ label: "GitHub", href: "https://" }];
                            return;
                          }
                          const [kind, id] = v.split(":") as ["project" | "company", string];
                          e.ref = { kind, id };
                        })
                      }
                    />
                    {entry.links ? (
                      <div className="flex flex-col gap-2">
                        {entry.links.map((link, li) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: 링크에는 별도 ID가 없다
                            key={li}
                            className="grid grid-cols-[8.5rem_minmax(0,1fr)_auto] items-end gap-2"
                          >
                            <TextField
                              label="링크 문구"
                              path={[...entryPath, "links", li, "label"]}
                              value={link.label}
                              onChange={(v) =>
                                setEntry((e) => {
                                  const target = e.links?.[li];
                                  if (target) target.label = v;
                                })
                              }
                            />
                            <TextField
                              label="주소"
                              path={[...entryPath, "links", li, "href"]}
                              value={link.href}
                              placeholder="https://github.com/..."
                              onChange={(v) =>
                                setEntry((e) => {
                                  const target = e.links?.[li];
                                  if (target) target.href = v;
                                })
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`${link.label} 링크 삭제`}
                              onClick={() =>
                                setEntry((e) => {
                                  e.links?.splice(li, 1);
                                  if (e.links?.length === 0) delete e.links;
                                })
                              }
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </div>
                        ))}
                        {entry.links.length < MAX_HISTORY_ENTRY_LINKS ? (
                          <Button
                            variant="outline"
                            size="xs"
                            className="self-start"
                            onClick={() =>
                              setEntry((e) => {
                                e.links?.push({ label: "GitHub", href: "https://" });
                              })
                            }
                          >
                            <Plus aria-hidden="true" /> 링크 추가
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Group>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          edit((d) => {
            d.content.history.chapters.push(newHistoryChapter());
          })
        }
      >
        <Plus aria-hidden="true" /> 챕터 추가
      </Button>
    </div>
  );
}
