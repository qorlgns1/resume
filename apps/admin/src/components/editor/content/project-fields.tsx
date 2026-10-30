"use client";

import type { Project, ProjectIconKey, ProjectTone } from "@resume/contracts";
import { projectIconLabel, projectToneLabel } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { BodyEditor } from "../body-editor";
import { CoverField } from "../cover-field";
import { useEditor } from "../editor-context";
import { CommaListField, SelectField, TextField } from "../fields";
import { currentYearMonth } from "./content-model";
import { LinksGroup, PeriodFields } from "./shared-fields";

const iconOptions = (Object.keys(projectIconLabel) as ProjectIconKey[]).map((value) => ({
  value,
  label: projectIconLabel[value],
}));
const toneOptions = (Object.keys(projectToneLabel) as ProjectTone[]).map((value) => ({
  value,
  label: projectToneLabel[value],
}));

/** 프로젝트 한 건: 기본 정보, 상태·아이콘·색, 태그, 링크, 기간, 커버, 본문 */
export function ProjectFields({ index, project }: { index: number; project: Project }) {
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
              p.period = { start: currentYearMonth(), end: null };
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
