import { type Media, mediaUrl, PUBLIC_MEDIA_BASE } from "@resume/contracts";
import { cn } from "@resume/ui/lib/utils";
import { PlaceholderMedia } from "./placeholder-media";
import type { RenderOptions } from "./types";

type ImageMedia = Extract<Media, { kind: "image" }>;

interface MediaImageProps {
  media: ImageMedia;
  options: RenderOptions;
  /** 화면에서 차지하는 너비 (srcset 선택 기준) */
  sizes: string;
  className?: string;
  /** 첫 화면에 보이는 이미지는 지연 로딩하지 않는다 */
  priority?: boolean;
}

/**
 * 업로드 이미지. 너비별 WebP 변환본을 srcset으로 주고 브라우저가 고르게 한다.
 * 이미지는 업로드할 때 이미 최적화했으므로 next/image 대신 img를 쓴다(이 패키지는 Next에 의존하지 않는다).
 */
export function MediaImage({
  media,
  options,
  sizes,
  className,
  priority = false,
}: MediaImageProps) {
  const base = options.mediaBase ?? PUBLIC_MEDIA_BASE;
  const largest = media.widths.at(-1) ?? media.width;
  return (
    // biome-ignore lint/performance/noImgElement: 업로드 시 만든 WebP 변환본을 srcset으로 직접 제공한다
    <img
      src={mediaUrl(base, media.assetId, largest)}
      srcSet={media.widths.map((w) => `${mediaUrl(base, media.assetId, w)} ${w}w`).join(", ")}
      sizes={sizes}
      alt={media.alt}
      width={media.width}
      height={media.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("h-auto max-w-full", className)}
    />
  );
}

/** 커버 영역: 업로드 이미지 또는 "예시 화면" 자리 표시 */
export function CoverMedia({
  media,
  options,
  sizes,
  frame = "window",
  className,
}: {
  media: Media | undefined;
  options: RenderOptions;
  sizes: string;
  /** 자리 표시의 모양, 그리고 이미지일 때 잘라 맞출 비율 */
  frame?: "window" | "phone" | "natural";
  className?: string;
}) {
  if (!media) return null;
  if (media.kind === "placeholder") {
    return (
      <PlaceholderMedia
        label={media.label}
        alt={media.alt}
        variant={frame === "phone" ? "phone" : "window"}
        className={className}
      />
    );
  }
  return (
    <MediaImage
      media={media}
      options={options}
      sizes={sizes}
      className={cn(
        "rs-line rounded-lg border bg-muted",
        frame !== "natural" && "w-full",
        // 원래 비율 그대로 보여주되, 세로로 긴 사진이 화면을 다 차지하지 않게 높이를 제한한다.
        frame === "natural" && "max-h-[36rem] w-auto",
        frame === "window" && "aspect-[16/10] object-cover",
        frame === "phone" &&
          (media.height > media.width
            ? "mx-auto aspect-[9/18] max-w-[11rem] rounded-[1.75rem] object-cover"
            : "aspect-[4/3] max-w-[16rem] object-cover"),
        className,
      )}
    />
  );
}
