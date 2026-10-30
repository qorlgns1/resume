"use client";

import type { Company } from "@resume/contracts";
import { BodyEditor } from "../body-editor";
import { useEditor } from "../editor-context";
import { CommaListField, TextField } from "../fields";
import { PeriodFields } from "./shared-fields";

/** 회사 한 곳: 이름·slug·역할·기간·설명·태그·본문 */
export function CompanyFields({ index, company }: { index: number; company: Company }) {
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
