"use client";

import { ADMIN_MEDIA_BASE, type Media, mediaUrl } from "@resume/contracts";
import { createId } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { ImageIcon, LayoutTemplate, X } from "lucide-react";
import { useState } from "react";
import { TextField } from "./fields";
import type { Path } from "./issues";
import { MediaPickerDialog } from "./media-settings";

interface CoverFieldProps {
  cover: Media | undefined;
  path: Path;
  onChange: (cover: Media | undefined) => void;
}

/** 프로젝트 커버: 업로드 이미지 / "예시 화면" 자리 표시 / 없음 */
export function CoverField({ cover, path, onChange }: CoverFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <span className="text-caption font-semibold text-muted-foreground">커버 이미지</span>
      {cover?.kind === "image" ? (
        // biome-ignore lint/performance/noImgElement: 어드민 미리보기는 이미 만든 변환본을 그대로 쓴다
        <img
          src={mediaUrl(ADMIN_MEDIA_BASE, cover.assetId, cover.widths[0] ?? cover.width)}
          alt=""
          className="aspect-[16/10] w-full rounded-md border border-border object-cover"
        />
      ) : (
        <p className="text-body-sm text-muted-foreground">
          {cover?.kind === "placeholder"
            ? `자리 표시 ("${cover.label}")를 보여줍니다.`
            : "커버가 없습니다."}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <ImageIcon aria-hidden="true" />{" "}
          {cover?.kind === "image" ? "이미지 바꾸기" : "이미지 고르기"}
        </Button>
        {cover?.kind !== "placeholder" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                id: createId("media"),
                kind: "placeholder",
                label: "예시 화면",
                alt: "예시 화면 자리",
              })
            }
          >
            <LayoutTemplate aria-hidden="true" /> 예시 화면으로
          </Button>
        ) : null}
        {cover ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            <X aria-hidden="true" /> 커버 없음
          </Button>
        ) : null}
      </div>
      {cover?.kind === "image" ? (
        <TextField
          label="대체 텍스트"
          description="화면을 볼 수 없는 사람에게 읽어 주는 설명입니다. 예: 근무 기록 화면"
          path={[...path, "alt"]}
          value={cover.alt}
          onChange={(alt) => onChange({ ...cover, alt })}
        />
      ) : null}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(asset) =>
          onChange({
            id: cover?.id ?? createId("media"),
            kind: "image",
            assetId: asset.id,
            alt: cover?.kind === "image" ? cover.alt : "",
            width: asset.width,
            height: asset.height,
            widths: asset.widths,
          })
        }
      />
    </div>
  );
}
