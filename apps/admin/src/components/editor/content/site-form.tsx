"use client";

import { FieldGroup } from "@resume/ui/components/field";
import { useEditor } from "../editor-context";
import { TextField } from "../fields";
import { LogoField } from "../logo-field";
import { LinksGroup } from "./shared-fields";

/** 사이트 정보: 제목·설명·로고·푸터 */
export function SiteForm() {
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
        메뉴 구성은 기본 페이지로 고정되어 있습니다. 메뉴 순서는 페이지 탭의 페이지 목록에서 끌어서
        바꿉니다.
      </p>
    </FieldGroup>
  );
}
