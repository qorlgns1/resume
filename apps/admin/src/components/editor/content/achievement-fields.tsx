"use client";

import type { Achievement } from "@resume/contracts";
import { useEditor } from "../editor-context";
import { CommaListField, Group, SelectField, TextField } from "../fields";

/** "관련 회사 없음" 선택지의 값 */
const NONE = "__none";

/** 성과 한 건: 제목·분류·설명·지표 변화·관련 회사 */
export function AchievementFields({
  index,
  achievement,
}: {
  index: number;
  achievement: Achievement;
}) {
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
