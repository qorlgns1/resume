import type { SiteSettings } from "@resume/contracts";
import { monogram } from "./format";
import { MediaImage } from "./media-image";
import type { RenderOptions } from "./types";

/**
 * 머리글 이름 앞의 표시: 로고 이미지, 없으면 이름 첫 글자. 숨김이면 그리지 않는다.
 * 바로 옆에 이름이 있으므로 화면 읽기 프로그램에는 읽히지 않게 한다.
 */
export function BrandMark({
  name,
  logo,
  options,
}: {
  name: string;
  logo: SiteSettings["logo"];
  options: RenderOptions;
}) {
  if (logo?.hidden) return null;
  if (logo?.image) {
    return (
      <span aria-hidden="true" className="flex h-8 shrink-0 items-center">
        <MediaImage
          media={{ ...logo.image, alt: "" }}
          options={options}
          sizes="160px"
          priority
          className="h-8 w-auto max-w-40 object-contain"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-bold text-primary-foreground"
    >
      {monogram(name)}
    </span>
  );
}
