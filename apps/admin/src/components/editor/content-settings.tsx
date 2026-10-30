"use client";

import { contentSectionLabels } from "./content/content-model";
import { CredentialsForm } from "./content/credentials-form";
import { HistoryForm } from "./content/history-form";
import { ListItemForm } from "./content/list-item-form";
import { ProfileForm } from "./content/profile-form";
import { SiteForm } from "./content/site-form";
import type { ContentSection } from "./editor-context";
import { MediaLibraryPanel } from "./media-settings";

/*
 * 원본 콘텐츠 편집의 진입점. 구역에 맞는 폼을 고른다.
 * 여기서 고친 내용은 이 콘텐츠를 참조하는 모든 페이지·모듈에 반영된다.
 * 폼은 content/ 폴더에 구역별로 있고, 순수 로직(구역 이름·새 항목·사용처 찾기)은 content/content-model.ts에 있다.
 */

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
      {section === "credentials" ? <CredentialsForm /> : null}
      {section === "media" ? <MediaLibraryPanel /> : null}
      {section !== "site" &&
      section !== "profile" &&
      section !== "history" &&
      section !== "credentials" &&
      section !== "media" ? (
        <ListItemForm section={section} itemId={itemId} />
      ) : null}
    </div>
  );
}
