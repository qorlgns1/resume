import { z } from "zod";
import { IdSchema } from "./primitives";

/*
 * 미디어(업로드 이미지) 계약.
 * 원본은 저장하지 않고, 위치 정보 등 메타데이터를 지운 WebP 변환본만 너비별로 저장한다.
 */

/** 만들 변환본 너비. 원본보다 큰 너비는 만들지 않는다. */
export const MEDIA_WIDTHS = [480, 960, 1600, 2560] as const;
export const MEDIA_MAX_WIDTH = 2560;
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
/** 받는 형식 (파일 내용으로 판별). SVG는 스크립트를 담을 수 있어 받지 않는다. */
export const MEDIA_ACCEPTED_FORMATS = ["jpeg", "png", "webp", "gif"] as const;
export const MEDIA_ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp,image/gif";

export const MediaAssetSchema = z.object({
  id: IdSchema,
  /** 업로드한 파일 이름 (표시용) */
  originalName: z.string().max(255),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  /** 변환본 전체 크기(바이트) */
  bytes: z.number().int().nonnegative(),
  animated: z.boolean(),
  createdAt: z.iso.datetime(),
  /** 이 이미지를 쓰는 곳. 하나라도 있으면 삭제할 수 없다. */
  usage: z.object({ draft: z.boolean(), versions: z.array(z.number().int().positive()) }),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const MediaUploadResponseSchema = z.object({ asset: MediaAssetSchema });
export const MediaListResponseSchema = z.object({ assets: z.array(MediaAssetSchema) });

/**
 * 변환본 주소. base는 실행 위치에 따라 다르다.
 * - 공개 사이트: "/media" (공개 사이트 서버가 어드민에서 받아 전달)
 * - 어드민: "/api/public/v1/media"
 */
export function mediaUrl(base: string, assetId: string, width: number): string {
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(assetId)}/${width}.webp`;
}

export const ADMIN_MEDIA_BASE = "/api/public/v1/media";
export const PUBLIC_MEDIA_BASE = "/media";
