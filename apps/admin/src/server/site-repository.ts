import "server-only";
import { type SiteDocument, SiteDocumentSchema } from "@resume/contracts";
import { sampleSiteDocument } from "@resume/contracts/samples";
import { desc, eq } from "drizzle-orm";
import { type AppDatabase, getDb } from "./db/client";
import { publishedVersions, siteDraft } from "./db/schema";

/*
 * 사이트 문서 저장소. 초안과 게시본을 읽고, 처음 실행할 때 샘플로 채운다.
 * DB에서 읽은 JSON은 항상 SiteDocumentSchema로 검증한다. 모양이 어긋나면 조용히 넘어가지 않고 오류를 낸다.
 * 초안 저장·게시·복원은 다음 단계에서 추가한다.
 */

export class StoredDocumentError extends Error {}

function parseDocument(raw: unknown, where: string): SiteDocument {
  const parsed = SiteDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new StoredDocumentError(
      `${where}에 저장된 문서가 계약과 다릅니다: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

/**
 * DB가 비어 있으면 샘플 문서로 초안과 첫 게시본(버전 1)을 만든다.
 * 이미 데이터가 있으면 아무것도 하지 않는다.
 */
export function seedIfEmpty(db: AppDatabase = getDb()): boolean {
  return db.transaction((tx) => {
    const existing = tx.select({ id: siteDraft.id }).from(siteDraft).get();
    if (existing) return false;
    const document = SiteDocumentSchema.parse(sampleSiteDocument);
    tx.insert(publishedVersions).values({ version: 1, document, note: "샘플 콘텐츠로 시작" }).run();
    tx.insert(siteDraft).values({ id: 1, document, baseVersion: 1, revision: 1 }).run();
    return true;
  });
}

export interface DraftRecord {
  document: SiteDocument;
  baseVersion: number | null;
  revision: number;
  updatedAt: Date;
}

export function getDraft(db: AppDatabase = getDb()): DraftRecord {
  seedIfEmpty(db);
  const row = db.select().from(siteDraft).where(eq(siteDraft.id, 1)).get();
  if (!row) throw new StoredDocumentError("초안이 없습니다.");
  return {
    document: parseDocument(row.document, "초안"),
    baseVersion: row.baseVersion,
    revision: row.revision,
    updatedAt: row.updatedAt,
  };
}

export interface PublishedRecord {
  version: number;
  document: SiteDocument;
  publishedAt: Date;
}

/** 가장 최근 게시본. 게시한 적이 없으면 null. */
export function getLatestPublished(db: AppDatabase = getDb()): PublishedRecord | null {
  seedIfEmpty(db);
  const row = db
    .select()
    .from(publishedVersions)
    .orderBy(desc(publishedVersions.version))
    .limit(1)
    .get();
  if (!row) return null;
  return {
    version: row.version,
    document: parseDocument(row.document, `게시 버전 ${row.version}`),
    publishedAt: row.publishedAt,
  };
}
