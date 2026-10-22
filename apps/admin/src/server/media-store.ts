import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  MEDIA_ACCEPTED_FORMATS,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_WIDTH,
  MEDIA_WIDTHS,
  type MediaAsset,
} from "@resume/contracts";
import { desc, eq, sql } from "drizzle-orm";
import sharp, { type Metadata } from "sharp";
import { type AppDatabase, getDb } from "./db/client";
import { mediaAssets, publishedVersions, siteDraft } from "./db/schema";
import { getMediaDir } from "./env";

/*
 * 업로드 이미지 저장소.
 * - 형식은 확장자가 아니라 파일 내용으로 판별한다. JPEG·PNG·WebP·GIF만 받는다(SVG 거부).
 * - 휴대폰 사진의 회전 정보를 반영한 뒤 EXIF(위치 정보 포함) 등 메타데이터를 모두 지운다.
 * - 원본은 저장하지 않고, 너비별 WebP 변환본만 MEDIA_DIR/{id}/{width}.webp로 저장한다.
 * - 초안이나 어느 게시 버전에서든 쓰이는 이미지는 삭제할 수 없다.
 */

export class MediaRejectedError extends Error {
  constructor(
    readonly code: "unsupported_media" | "too_large",
    message: string,
  ) {
    super(message);
  }
}

export class MediaInUseError extends Error {
  constructor() {
    super("초안이나 게시 버전에서 쓰고 있어 삭제할 수 없습니다.");
  }
}

export class MediaNotFoundError extends Error {}

const ID_PATTERN = /^med_[a-f0-9]{16}$/;

function variantPath(id: string, width: number) {
  return path.join(getMediaDir(), id, `${width}.webp`);
}

/** 원본 너비에 맞춰 만들 변환본 너비. 원본보다 크게 만들지 않는다. */
export function targetWidths(originalWidth: number): number[] {
  const capped = Math.min(originalWidth, MEDIA_MAX_WIDTH);
  const widths = MEDIA_WIDTHS.filter((w) => w < capped) as number[];
  widths.push(capped);
  return [...new Set(widths)].sort((a, b) => a - b);
}

type Row = typeof mediaAssets.$inferSelect;

/** 이 이미지를 쓰는 곳: 초안 여부와 게시 버전 번호 */
function usageOf(db: AppDatabase, id: string): MediaAsset["usage"] {
  // 문서는 JSON 문자열로 저장되므로 참조("assetId":"<id>")를 문자열로 찾는다. ID 형식이 고정이라 오탐이 없다.
  const needle = `%"assetId":"${id}"%`;
  const draft = db
    .select({ id: siteDraft.id })
    .from(siteDraft)
    .where(sql`${siteDraft.document} LIKE ${needle}`)
    .get();
  const versions = db
    .select({ version: publishedVersions.version })
    .from(publishedVersions)
    .where(sql`${publishedVersions.document} LIKE ${needle}`)
    .orderBy(desc(publishedVersions.version))
    .all()
    .map((r) => r.version);
  return { draft: Boolean(draft), versions };
}

function toAsset(db: AppDatabase, row: Row): MediaAsset {
  return {
    id: row.id,
    originalName: row.originalName,
    width: row.width,
    height: row.height,
    widths: row.widths,
    bytes: row.bytes,
    animated: row.animated,
    createdAt: row.createdAt.toISOString(),
    usage: usageOf(db, row.id),
  };
}

export function listMedia(db: AppDatabase = getDb()): MediaAsset[] {
  return db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .all()
    .map((row) => toAsset(db, row));
}

export async function saveUpload(
  file: { name: string; bytes: Buffer },
  db: AppDatabase = getDb(),
): Promise<MediaAsset> {
  if (file.bytes.byteLength > MEDIA_MAX_BYTES) {
    throw new MediaRejectedError(
      "too_large",
      `파일은 ${MEDIA_MAX_BYTES / 1024 / 1024}MB까지 올릴 수 있습니다.`,
    );
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(file.bytes, { animated: true, limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new MediaRejectedError("unsupported_media", "이미지 파일로 읽을 수 없습니다.");
  }
  const format = metadata.format as string | undefined;
  if (!format || !(MEDIA_ACCEPTED_FORMATS as readonly string[]).includes(format)) {
    throw new MediaRejectedError(
      "unsupported_media",
      "JPG, PNG, WebP, GIF 이미지만 올릴 수 있습니다.",
    );
  }

  const animated = (metadata.pages ?? 1) > 1;
  // 회전 정보를 반영한 실제 크기 (EXIF orientation 5~8은 가로·세로가 바뀐다)
  const rotated = (metadata.orientation ?? 1) >= 5;
  const width = rotated ? (metadata.height ?? 0) : (metadata.width ?? 0);
  const pageHeight = metadata.pageHeight ?? metadata.height ?? 0;
  const height = rotated ? (metadata.width ?? 0) : pageHeight;
  if (!width || !height)
    throw new MediaRejectedError("unsupported_media", "이미지 크기를 알 수 없습니다.");

  const id = `med_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const widths = targetWidths(width);
  const dir = path.join(getMediaDir(), id);
  await fs.mkdir(dir, { recursive: true });

  let bytes = 0;
  try {
    for (const target of widths) {
      // sharp는 withMetadata()를 부르지 않으면 EXIF·GPS·ICC 등 메타데이터를 남기지 않는다.
      const info = await sharp(file.bytes, { animated, limitInputPixels: 50_000_000 })
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(variantPath(id, target));
      bytes += info.size;
    }
  } catch (error) {
    await fs.rm(dir, { recursive: true, force: true });
    throw error;
  }

  const largest = widths.at(-1) ?? width;
  const row = db
    .insert(mediaAssets)
    .values({
      id,
      originalName: path.basename(file.name).slice(0, 255) || "image",
      width: largest,
      height: Math.round((height * largest) / width),
      widths,
      bytes,
      animated,
    })
    .returning()
    .get();
  return toAsset(db, row);
}

export async function deleteMedia(id: string, db: AppDatabase = getDb()): Promise<void> {
  if (!ID_PATTERN.test(id)) throw new MediaNotFoundError();
  const row = db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get();
  if (!row) throw new MediaNotFoundError();
  const usage = usageOf(db, id);
  if (usage.draft || usage.versions.length > 0) throw new MediaInUseError();
  db.delete(mediaAssets).where(eq(mediaAssets.id, id)).run();
  await fs.rm(path.join(getMediaDir(), id), { recursive: true, force: true });
}

/** 공개 제공용: 등록된 이미지의 등록된 너비만 연다. 경로 조작을 막기 위해 ID·너비를 DB와 대조한다. */
export async function openVariant(
  id: string,
  width: number,
  db: AppDatabase = getDb(),
): Promise<{ file: string; size: number } | null> {
  if (!ID_PATTERN.test(id) || !Number.isInteger(width)) return null;
  const row = db
    .select({ widths: mediaAssets.widths })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .get();
  if (!row?.widths.includes(width)) return null;
  const file = variantPath(id, width);
  try {
    const stat = await fs.stat(file);
    return { file, size: stat.size };
  } catch {
    return null;
  }
}
