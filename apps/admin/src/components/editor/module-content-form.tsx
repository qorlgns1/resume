"use client";

import { MAX_HOME_PROJECTS, type ModuleInstance } from "@resume/contracts";
import { convertModuleVariant, hasModuleVariants, moduleVariants } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useEditor } from "./editor-context";
import { Group, ReferencePicker, SelectField, SwitchField, TextField } from "./fields";
import type { Path } from "./issues";

interface Props {
  module: ModuleInstance;
  /** 이 모듈의 문서 경로: ["pages", i, "modules", j] */
  path: Path;
  /** 이 모듈을 고친다 */
  update: (mutate: (module: ModuleInstance) => void) => void;
}

/** 선택 입력: 비우면 undefined로 저장한다 */
const optional = (value: string) => (value.trim() === "" ? undefined : value);

function LinkFields({
  path,
  link,
  onChange,
  optionalLink = true,
}: {
  path: Path;
  link: { label: string; href: string } | undefined;
  onChange: (link: { label: string; href: string } | undefined) => void;
  optionalLink?: boolean;
}) {
  const label = link?.label ?? "";
  const href = link?.href ?? "";
  const set = (next: { label: string; href: string }) =>
    onChange(optionalLink && !next.label && !next.href ? undefined : next);
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="링크 문구"
        path={[...path, "label"]}
        value={label}
        onChange={(v) => set({ label: v, href })}
      />
      <TextField
        label="주소"
        path={[...path, "href"]}
        value={href}
        placeholder="/projects"
        onChange={(v) => set({ label, href: v })}
      />
    </div>
  );
}

export function ModuleContentForm(props: Props) {
  return (
    <>
      <VariantField {...props} />
      <ModuleFields {...props} />
    </>
  );
}

/** 형태를 고를 수 있는 모듈이면 형태 선택을 보여준다. 바꾸면 새 형태의 기본값으로 바뀐다. */
function VariantField({ module, path, update }: Props) {
  const { document } = useEditor();
  const [error, setError] = useState<string | null>(null);
  if (!hasModuleVariants(module.type) || !("variant" in module.props)) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <SelectField
        label="형태"
        description="형태를 바꾸면 콘텐츠 설정과 기본 배경·여백이 새 형태에 맞게 바뀝니다."
        path={[...path, "props", "variant"]}
        value={module.props.variant}
        options={moduleVariants[module.type]}
        onChange={(variant) => {
          const result = convertModuleVariant(module, variant, document.content);
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          setError(null);
          update((m) => {
            m.props = result.module.props;
            m.style = result.module.style;
          });
        }}
      />
      {error ? (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ModuleFields({ module, path, update }: Props) {
  const { document, select } = useEditor();
  const { content } = document;
  const props = [...path, "props"] as const;

  switch (module.type) {
    case "intro": {
      if (module.props.variant === "principles") {
        return (
          <ContentNote onOpen={() => select({ kind: "content", section: "profile" })}>
            일하는 방식 항목은 원본 콘텐츠의 프로필에서 편집합니다.
          </ContentNote>
        );
      }
      const actions = module.props.actions;
      return (
        <>
          <ContentNote onOpen={() => select({ kind: "content", section: "profile" })}>
            대표 문구, 소개, 이름은 원본 콘텐츠의 프로필에서 편집합니다.
          </ContentNote>
          <SwitchField
            label="이름 표시"
            checked={module.props.showName}
            onChange={(checked) =>
              update((m) => {
                if (m.type === "intro" && m.props.variant === "hero") m.props.showName = checked;
              })
            }
          />
          <Group
            title={`버튼 (${actions.length}/4)`}
            action={
              <Button
                variant="outline"
                size="xs"
                disabled={actions.length >= 4}
                onClick={() =>
                  update((m) => {
                    if (m.type === "intro" && m.props.variant === "hero") {
                      m.props.actions.push({
                        id: `act_${globalThis.crypto.randomUUID().slice(0, 8)}`,
                        label: "새 버튼",
                        href: "/",
                        emphasis: "secondary",
                      });
                    }
                  })
                }
              >
                <Plus aria-hidden="true" /> 추가
              </Button>
            }
          >
            {actions.map((action, index) => {
              const actionPath = [...props, "actions", index];
              const set = (mutate: (a: (typeof actions)[number]) => void) =>
                update((m) => {
                  if (m.type === "intro" && m.props.variant === "hero") {
                    const target = m.props.actions[index];
                    if (target) mutate(target);
                  }
                });
              return (
                <div
                  key={action.id}
                  className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label="문구"
                      path={[...actionPath, "label"]}
                      value={action.label}
                      onChange={(v) =>
                        set((a) => {
                          a.label = v;
                        })
                      }
                    />
                    <TextField
                      label="주소"
                      path={[...actionPath, "href"]}
                      value={action.href}
                      onChange={(v) =>
                        set((a) => {
                          a.href = v;
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <SelectField
                      label="강조"
                      className="flex-1"
                      path={[...actionPath, "emphasis"]}
                      value={action.emphasis}
                      options={[
                        { value: "primary", label: "강조 (파란 버튼)" },
                        { value: "secondary", label: "보조 (외곽선)" },
                      ]}
                      onChange={(v) =>
                        set((a) => {
                          a.emphasis = v;
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${action.label} 버튼 삭제`}
                      onClick={() =>
                        update((m) => {
                          if (m.type === "intro" && m.props.variant === "hero")
                            m.props.actions.splice(index, 1);
                        })
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </Group>
        </>
      );
    }

    case "projects": {
      const projectOptions = content.projects.map((p) => ({ id: p.id, label: p.title }));
      if (module.props.variant === "spotlight") {
        const p = module.props;
        return (
          <>
            <TextField
              label="보조 제목"
              path={[...props, "eyebrow"]}
              value={p.eyebrow}
              onChange={(v) =>
                update((m) => {
                  if (m.type === "projects" && m.props.variant === "spotlight") m.props.eyebrow = v;
                })
              }
            />
            <SelectField
              label="강조할 프로젝트"
              path={[...props, "projectId"]}
              value={p.projectId}
              options={projectOptions.map((o) => ({ value: o.id, label: o.label }))}
              onChange={(v) =>
                update((m) => {
                  if (m.type === "projects" && m.props.variant === "spotlight")
                    m.props.projectId = v;
                })
              }
            />
            <LinkFields
              path={[...props, "link"]}
              link={p.link}
              onChange={(link) =>
                update((m) => {
                  if (m.type === "projects" && m.props.variant === "spotlight") {
                    m.props.link = link
                      ? { id: m.props.link?.id ?? "lnk_spotlight", ...link }
                      : undefined;
                  }
                })
              }
            />
          </>
        );
      }
      const p = module.props;
      return (
        <>
          <TextField
            label="제목"
            path={[...props, "heading"]}
            value={p.heading}
            onChange={(v) =>
              update((m) => {
                if (m.type === "projects" && m.props.variant === "grid") m.props.heading = v;
              })
            }
          />
          <TextField
            label="설명"
            path={[...props, "description"]}
            value={p.description ?? ""}
            multiline
            onChange={(v) =>
              update((m) => {
                if (m.type === "projects" && m.props.variant === "grid")
                  m.props.description = optional(v);
              })
            }
          />
          <ReferencePicker
            legend="표시할 프로젝트"
            description="선택한 순서대로 표시합니다. 홈에는 최대 3개까지 보여줍니다."
            path={[...props, "projectIds"]}
            options={projectOptions}
            value={p.projectIds}
            max={MAX_HOME_PROJECTS}
            onChange={(ids) =>
              update((m) => {
                if (m.type === "projects" && m.props.variant === "grid") m.props.projectIds = ids;
              })
            }
          />
          <TextField
            label="안내 문구"
            path={[...props, "mediaNote"]}
            value={p.mediaNote ?? ""}
            onChange={(v) =>
              update((m) => {
                if (m.type === "projects" && m.props.variant === "grid")
                  m.props.mediaNote = optional(v);
              })
            }
          />
          <LinkFields
            path={[...props, "viewAll"]}
            link={p.viewAll}
            onChange={(link) =>
              update((m) => {
                if (m.type === "projects" && m.props.variant === "grid") {
                  m.props.viewAll = link
                    ? { id: m.props.viewAll?.id ?? "lnk_view_all", ...link }
                    : undefined;
                }
              })
            }
          />
        </>
      );
    }

    case "achievements": {
      const p = module.props;
      return (
        <>
          <TextField
            label="제목"
            path={[...props, "heading"]}
            value={p.heading}
            onChange={(v) =>
              update((m) => {
                if (m.type === "achievements") m.props.heading = v;
              })
            }
          />
          <TextField
            label="설명"
            path={[...props, "description"]}
            value={p.description ?? ""}
            onChange={(v) =>
              update((m) => {
                if (m.type === "achievements") m.props.description = optional(v);
              })
            }
          />
          <ReferencePicker
            legend="표시할 성과"
            path={[...props, "achievementIds"]}
            options={content.achievements.map((a) => ({ id: a.id, label: a.title }))}
            value={p.achievementIds}
            max={4}
            onChange={(ids) =>
              update((m) => {
                if (m.type === "achievements") m.props.achievementIds = ids;
              })
            }
          />
        </>
      );
    }

    case "tech-stack": {
      const p = module.props;
      return (
        <>
          <TextField
            label="제목"
            path={[...props, "heading"]}
            value={p.heading}
            onChange={(v) =>
              update((m) => {
                if (m.type === "tech-stack") m.props.heading = v;
              })
            }
          />
          <TextField
            label="설명"
            path={[...props, "description"]}
            value={p.description ?? ""}
            onChange={(v) =>
              update((m) => {
                if (m.type === "tech-stack") m.props.description = optional(v);
              })
            }
          />
          <ReferencePicker
            legend="표시할 기술 분류"
            path={[...props, "groupIds"]}
            options={content.techStack.map((g) => ({
              id: g.id,
              label: g.label,
              hint: g.items.join(", "),
            }))}
            value={p.groupIds}
            max={6}
            onChange={(ids) =>
              update((m) => {
                if (m.type === "tech-stack") m.props.groupIds = ids;
              })
            }
          />
        </>
      );
    }

    case "status": {
      const p = module.props;
      const set = (mutate: (props: typeof p) => void) =>
        update((m) => {
          if (m.type === "status") mutate(m.props);
        });
      return (
        <>
          <TextField
            label="보조 제목"
            path={[...props, "eyebrow"]}
            value={p.eyebrow}
            onChange={(v) =>
              set((x) => {
                x.eyebrow = v;
              })
            }
          />
          <TextField
            label="제목"
            path={[...props, "title"]}
            value={p.title}
            onChange={(v) =>
              set((x) => {
                x.title = v;
              })
            }
          />
          <TextField
            label="설명"
            path={[...props, "description"]}
            value={p.description}
            multiline
            onChange={(v) =>
              set((x) => {
                x.description = v;
              })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="상태 배지"
              path={[...props, "badge", "label"]}
              value={p.badge?.label ?? ""}
              description="비우면 표시하지 않습니다."
              onChange={(v) =>
                set((x) => {
                  x.badge = v.trim() ? { label: v, tone: x.badge?.tone ?? "neutral" } : undefined;
                })
              }
            />
            <SelectField
              label="배지 색"
              path={[...props, "badge", "tone"]}
              value={p.badge?.tone ?? "neutral"}
              options={[
                { value: "neutral", label: "기본" },
                { value: "primary", label: "강조" },
                { value: "success", label: "완료" },
                { value: "warning", label: "주의" },
              ]}
              onChange={(v) =>
                set((x) => {
                  if (x.badge) x.badge.tone = v;
                })
              }
            />
          </div>
          <Group
            title={`항목 (${p.items.length}/4)`}
            action={
              <Button
                variant="outline"
                size="xs"
                disabled={p.items.length >= 4}
                onClick={() =>
                  set((x) => {
                    x.items.push({
                      id: `st_${globalThis.crypto.randomUUID().slice(0, 8)}`,
                      label: "항목",
                      description: "",
                    });
                  })
                }
              >
                <Plus aria-hidden="true" /> 추가
              </Button>
            }
          >
            {p.items.map((item, index) => (
              <div key={item.id} className="flex items-end gap-2">
                <TextField
                  className="w-24"
                  label="이름"
                  path={[...props, "items", index, "label"]}
                  value={item.label}
                  onChange={(v) =>
                    set((x) => {
                      const t = x.items[index];
                      if (t) t.label = v;
                    })
                  }
                />
                <TextField
                  className="flex-1"
                  label="설명"
                  path={[...props, "items", index, "description"]}
                  value={item.description}
                  onChange={(v) =>
                    set((x) => {
                      const t = x.items[index];
                      if (t) t.description = v;
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${item.label} 항목 삭제`}
                  onClick={() =>
                    set((x) => {
                      x.items.splice(index, 1);
                    })
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </Group>
          <LinkFields
            path={[...props, "link"]}
            link={p.link}
            onChange={(link) =>
              set((x) => {
                x.link = link ? { id: x.link?.id ?? "lnk_status", ...link } : undefined;
              })
            }
          />
        </>
      );
    }

    case "history-entry": {
      const p = module.props;
      return (
        <>
          <TextField
            label="제목"
            path={[...props, "heading"]}
            value={p.heading}
            onChange={(v) =>
              update((m) => {
                if (m.type === "history-entry") m.props.heading = v;
              })
            }
          />
          <TextField
            label="설명"
            path={[...props, "description"]}
            value={p.description ?? ""}
            multiline
            onChange={(v) =>
              update((m) => {
                if (m.type === "history-entry") m.props.description = optional(v);
              })
            }
          />
          <ReferencePicker
            legend="표시할 회사"
            path={[...props, "companyIds"]}
            options={content.companies.map((c) => ({ id: c.id, label: c.name }))}
            value={p.companyIds}
            max={6}
            onChange={(ids) =>
              update((m) => {
                if (m.type === "history-entry") m.props.companyIds = ids;
              })
            }
          />
          <LinkFields
            path={[...props, "link"]}
            link={p.link}
            optionalLink={false}
            onChange={(link) =>
              update((m) => {
                if (m.type === "history-entry" && link) m.props.link = link;
              })
            }
          />
        </>
      );
    }
  }
}

function ContentNote({ children, onOpen }: { children: string; onOpen: () => void }) {
  return (
    <p className="flex flex-col items-start gap-1 rounded-md bg-muted px-3 py-2 text-caption text-muted-foreground">
      {children}
      <Button variant="link" size="xs" className="h-auto px-0" onClick={onOpen}>
        프로필 편집으로 이동
      </Button>
    </p>
  );
}
