"use client";

import { ADMIN_MEDIA_BASE, mediaUrl, type SiteSettings } from "@resume/contracts";
import { createId, monogram } from "@resume/modules";
import { Button } from "@resume/ui/components/button";
import { ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { SwitchField } from "./fields";
import { MediaPickerDialog } from "./media-settings";

type Logo = SiteSettings["logo"];

interface LogoFieldProps {
  logo: Logo;
  /** 이름 첫 글자 표시에 쓰는 프로필 이름 */
  name: string;
  onChange: (logo: Logo) => void;
}

/** 기본값(보이기, 이미지 없음)이면 저장하지 않는다. */
function normalize(logo: NonNullable<Logo>): Logo {
  return !logo.hidden && !logo.image ? undefined : logo;
}

/** 머리글 로고: 업로드 이미지 / 없으면 이름 첫 글자 / 숨김 */
export function LogoField({ logo, name, onChange }: LogoFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hidden = logo?.hidden ?? false;
  const image = logo?.image;
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <SwitchField
        label="머리글 로고 표시"
        description="이름 앞에 로고를 보여줍니다. 로고 이미지가 없으면 이름 첫 글자를 보여줍니다."
        checked={!hidden}
        onChange={(checked) => onChange(normalize({ hidden: !checked, image }))}
      />
      {hidden ? null : (
        <>
          <div className="flex items-center gap-3">
            {image ? (
              // biome-ignore lint/performance/noImgElement: 어드민 미리보기는 이미 만든 변환본을 그대로 쓴다
              <img
                src={mediaUrl(ADMIN_MEDIA_BASE, image.assetId, image.widths[0] ?? image.width)}
                alt=""
                className="h-8 w-auto max-w-40 object-contain"
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-bold text-primary-foreground">
                {monogram(name)}
              </span>
            )}
            <p className="text-caption text-muted-foreground">
              {image
                ? "업로드한 로고를 보여줍니다."
                : "로고 이미지가 없어 이름 첫 글자를 보여줍니다."}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <ImageIcon aria-hidden="true" /> {image ? "로고 바꾸기" : "로고 이미지 고르기"}
            </Button>
            {image ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(normalize({ hidden: false }))}
              >
                <X aria-hidden="true" /> 로고 지우고 첫 글자로
              </Button>
            ) : null}
          </div>
          <p className="text-caption text-muted-foreground">
            높이 32px로 줄여 보여줍니다. 배경이 투명한 PNG나 가로로 긴 로고가 잘 어울립니다.
          </p>
        </>
      )}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(asset) =>
          onChange({
            hidden: false,
            image: {
              id: image?.id ?? createId("media"),
              kind: "image",
              assetId: asset.id,
              alt: "",
              width: asset.width,
              height: asset.height,
              widths: asset.widths,
            },
          })
        }
      />
    </div>
  );
}
