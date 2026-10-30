"use client";

import { createId } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { Plus, Trash2 } from "lucide-react";
import { useEditor } from "../editor-context";
import { Group, TextField } from "../fields";
import { currentYearMonth } from "./content-model";
import { PeriodFields } from "./shared-fields";

/** 학력·자격증: 두 목록을 한 화면에서 고친다. 공개 화면은 최신순으로 정렬한다. */
export function CredentialsForm() {
  const { document, edit } = useEditor();
  const { education, certifications } = document.content;
  return (
    <div className="flex flex-col gap-4">
      <Group
        title={`학력 (${education.length})`}
        action={
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              edit((d) => {
                d.content.education.push({
                  id: createId("edu"),
                  school: "새 학교",
                  major: "",
                  degree: "",
                  period: { start: currentYearMonth(), end: null },
                });
              })
            }
          >
            <Plus aria-hidden="true" /> 학력 추가
          </Button>
        }
      >
        {education.map((item, index) => {
          const path = ["content", "education", index] as const;
          const set = (mutate: (e: (typeof education)[number]) => void) =>
            edit((d) => {
              const target = d.content.education[index];
              if (target) mutate(target);
            });
          return (
            <div key={item.id} className="flex flex-col gap-2 rounded-md bg-muted p-2.5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                <TextField
                  label="학교"
                  description="학점은행제처럼 학위를 받은 방식을 적어도 됩니다."
                  path={[...path, "school"]}
                  value={item.school}
                  onChange={(v) =>
                    set((e) => {
                      e.school = v;
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${item.school} 삭제`}
                  onClick={() =>
                    edit((d) => {
                      d.content.education.splice(index, 1);
                    })
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="전공"
                  path={[...path, "major"]}
                  value={item.major}
                  placeholder="컴퓨터공학"
                  onChange={(v) =>
                    set((e) => {
                      e.major = v;
                    })
                  }
                />
                <TextField
                  label="학위"
                  path={[...path, "degree"]}
                  value={item.degree}
                  placeholder="학사"
                  onChange={(v) =>
                    set((e) => {
                      e.degree = v;
                    })
                  }
                />
              </div>
              <PeriodFields
                path={[...path, "period"]}
                period={item.period}
                onChange={(period) =>
                  set((e) => {
                    e.period = period;
                  })
                }
              />
              <TextField
                label="덧붙임 (선택)"
                path={[...path, "note"]}
                value={item.note ?? ""}
                placeholder="학점 4.0/4.5"
                onChange={(v) =>
                  set((e) => {
                    e.note = v.trim() ? v : undefined;
                  })
                }
              />
            </div>
          );
        })}
      </Group>
      <Group
        title={`자격증 (${certifications.length})`}
        action={
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              edit((d) => {
                d.content.certifications.push({
                  id: createId("cert"),
                  name: "새 자격증",
                  issuer: "",
                  date: currentYearMonth(),
                });
              })
            }
          >
            <Plus aria-hidden="true" /> 자격증 추가
          </Button>
        }
      >
        {certifications.map((item, index) => {
          const path = ["content", "certifications", index] as const;
          const set = (mutate: (c: (typeof certifications)[number]) => void) =>
            edit((d) => {
              const target = d.content.certifications[index];
              if (target) mutate(target);
            });
          return (
            <div key={item.id} className="flex flex-col gap-2 rounded-md bg-muted p-2.5">
              <div className="grid grid-cols-[minmax(0,1fr)_8.5rem_auto] items-end gap-2">
                <TextField
                  label="자격증"
                  path={[...path, "name"]}
                  value={item.name}
                  onChange={(v) =>
                    set((c) => {
                      c.name = v;
                    })
                  }
                />
                <TextField
                  label="취득일"
                  type="month"
                  path={[...path, "date"]}
                  value={item.date}
                  onChange={(v) =>
                    set((c) => {
                      c.date = v;
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${item.name} 삭제`}
                  onClick={() =>
                    edit((d) => {
                      d.content.certifications.splice(index, 1);
                    })
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <TextField
                label="발급 기관"
                path={[...path, "issuer"]}
                value={item.issuer}
                placeholder="한국산업인력공단"
                onChange={(v) =>
                  set((c) => {
                    c.issuer = v;
                  })
                }
              />
            </div>
          );
        })}
      </Group>
    </div>
  );
}
