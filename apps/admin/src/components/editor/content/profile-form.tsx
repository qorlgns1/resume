"use client";

import { createId } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { FieldGroup } from "@resume/ui/components/field";
import { Plus, Trash2 } from "lucide-react";
import { BodyEditor } from "../body-editor";
import { useEditor } from "../editor-context";
import { CommaListField, Group, TextField } from "../fields";

/** 프로필: 이름·직무·대표 문구·일하는 방식·소개 본문 */
export function ProfileForm() {
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
      <BodyEditor
        title={`${profile.name} 소개`}
        label="소개 페이지 본문"
        body={profile.about}
        path={[...path, "about"]}
        onChange={(blocks) =>
          edit((d) => {
            d.content.profile.about = blocks;
          })
        }
      />
    </FieldGroup>
  );
}
