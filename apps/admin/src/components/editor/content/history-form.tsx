"use client";

import { MAX_HISTORY_ENTRY_LINKS } from "@resume/contracts";
import { createId } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { cn } from "@resume/ui/lib/utils";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useEditor } from "../editor-context";
import { Group, SelectField, TextField } from "../fields";
import { currentYearMonth, newHistoryChapter } from "./content-model";
import { DeleteContentButton, PeriodFields } from "./shared-fields";

/** "연결" 선택지의 특수 값 */
const NO_REF = "__none";
const EXTERNAL_LINK = "__link";

/** 히스토리: 챕터 + 타임라인. 항목은 회사·프로젝트를 연결하거나 직접 쓴다. 공개 화면은 날짜순으로 정렬한다. */
export function HistoryForm({ itemId }: { itemId?: string }) {
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
