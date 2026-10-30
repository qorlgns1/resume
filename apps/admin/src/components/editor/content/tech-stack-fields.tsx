"use client";

import type { TechStackGroup } from "@resume/contracts";
import { useEditor } from "../editor-context";
import { CommaListField, TextField } from "../fields";

/** 기술 스택 분류 하나: 이름과 기술 목록 */
export function TechStackFields({ index, group }: { index: number; group: TechStackGroup }) {
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
