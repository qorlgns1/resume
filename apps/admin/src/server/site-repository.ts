import "server-only";
import {
  type DraftState,
  type SiteDocument,
  SiteDocumentSchema,
  type VersionSummary,
} from "@resume/contracts";
import { sampleSiteDocument } from "@resume/contracts/samples";
import { desc, eq } from "drizzle-orm";
import { type AppDatabase, getDb } from "./db/client";
import { publishedVersions, siteDraft } from "./db/schema";

/*
 * 사이트 문서 저장소: 초안 1개 + 게시 버전 목록.
 *
 * - DB에서 읽거나 DB에 쓰는 JSON은 항상 SiteDocumentSchema로 검증한다.
 * - 초안을 바꾸는 모든 작업(저장·게시·복원)은 요청자가 본 revision을 받아 현재 값과 비교한다.
 *   다르면 다른 탭이나 기기에서 먼저 바꾼 것이므로 덮어쓰지 않고 ConflictError를 낸다.
 * - 게시는 초안을 그대로 복사해 새 버전을 만든다. 복원은 이전 버전을 초안으로 가져올 뿐 게시하지 않는다.
 */

export class StoredDocumentError extends Error {}

/** 요청한 revision이 현재 초안과 다름 */
export class ConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super("다른 곳에서 초안이 먼저 바뀌었습니다.");
  }
}

/** 초안이 가장 최근 게시본과 같아 게시할 것이 없음 */
export class NothingToPublishError extends Error {
  constructor() {
    super("게시할 변경 사항이 없습니다.");
  }
}

export class VersionNotFoundError extends Error {
  constructor(version: number) {
    super(`버전 ${version}을 찾을 수 없습니다.`);
  }
}

type Tx = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];
type Reader = AppDatabase | Tx;

function parseDocument(raw: unknown, where: string): SiteDocument {
  const parsed = SiteDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new StoredDocumentError(
      `${where}에 저장된 문서가 계약과 다릅니다: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

/** 객체 키 순서와 무관하게 같은 내용이면 같은 문자열을 만든다. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
}

function sameDocument(a: SiteDocument, b: SiteDocument): boolean {
  return canonicalJson(a) === canonicalJson(b);
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

function readDraftRow(tx: Reader) {
  const row = tx.select().from(siteDraft).where(eq(siteDraft.id, 1)).get();
  if (!row) throw new StoredDocumentError("초안이 없습니다.");
  return row;
}

function readLatestRow(tx: Reader) {
  return (
    tx.select().from(publishedVersions).orderBy(desc(publishedVersions.version)).limit(1).get() ??
    null
  );
}

function toSummary(row: typeof publishedVersions.$inferSelect): VersionSummary {
  return {
    version: row.version,
    publishedAt: row.publishedAt.toISOString(),
    note: row.note,
    restoredFrom: row.restoredFrom,
  };
}

function buildDraftState(tx: Reader): DraftState {
  const draft = readDraftRow(tx);
  const document = parseDocument(draft.document, "초안");
  const latest = readLatestRow(tx);
  const latestDocument = latest
    ? parseDocument(latest.document, `게시 버전 ${latest.version}`)
    : null;
  return {
    document,
    revision: draft.revision,
    updatedAt: draft.updatedAt.toISOString(),
    restoredFrom: draft.restoredFrom,
    latestVersion: latest?.version ?? null,
    hasUnpublishedChanges: latestDocument ? !sameDocument(document, latestDocument) : true,
  };
}

function assertRevision(tx: Reader, expected: number) {
  const current = readDraftRow(tx).revision;
  if (current !== expected) throw new ConflictError(current);
}

/** 편집 화면이 쓰는 초안 상태 */
export function getDraftState(db: AppDatabase = getDb()): DraftState {
  seedIfEmpty(db);
  return buildDraftState(db);
}

/** 초안을 저장한다. 문서는 저장 전에 다시 검증한다. */
export function saveDraft(
  input: { revision: number; document: SiteDocument },
  db: AppDatabase = getDb(),
): DraftState {
  const document = SiteDocumentSchema.parse(input.document);
  seedIfEmpty(db);
  return db.transaction((tx) => {
    const current = readDraftRow(tx);
    if (current.revision !== input.revision) throw new ConflictError(current.revision);
    tx.update(siteDraft)
      .set({ document, revision: current.revision + 1, updatedAt: new Date() })
      .where(eq(siteDraft.id, 1))
      .run();
    return buildDraftState(tx);
  });
}

/** 현재 초안을 새 버전으로 게시한다. */
export function publishDraft(
  input: { revision: number; note?: string | undefined },
  db: AppDatabase = getDb(),
): { published: VersionSummary; draft: DraftState } {
  seedIfEmpty(db);
  return db.transaction((tx) => {
    assertRevision(tx, input.revision);
    const state = buildDraftState(tx);
    if (!state.hasUnpublishedChanges) throw new NothingToPublishError();

    const version = (state.latestVersion ?? 0) + 1;
    const row = tx
      .insert(publishedVersions)
      .values({
        version,
        document: state.document,
        note: input.note?.trim() || null,
        restoredFrom: state.restoredFrom,
      })
      .returning()
      .get();
    tx.update(siteDraft)
      .set({
        baseVersion: version,
        restoredFrom: null,
        revision: state.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(siteDraft.id, 1))
      .run();
    return { published: toSummary(row), draft: buildDraftState(tx) };
  });
}

/** 게시 버전 목록 (최신순) */
export function listVersions(db: AppDatabase = getDb()): VersionSummary[] {
  seedIfEmpty(db);
  return db
    .select({
      version: publishedVersions.version,
      publishedAt: publishedVersions.publishedAt,
      note: publishedVersions.note,
      restoredFrom: publishedVersions.restoredFrom,
    })
    .from(publishedVersions)
    .orderBy(desc(publishedVersions.version))
    .all()
    .map((row) => ({ ...row, publishedAt: row.publishedAt.toISOString() }));
}

/**
 * 이전 게시 버전을 초안으로 가져온다. 게시는 하지 않는다.
 * 공개 사이트에 반영하려면 이어서 게시해야 하며, 그 버전에는 "N에서 복원"이 기록된다.
 */
export function restoreVersion(
  input: { version: number; revision: number },
  db: AppDatabase = getDb(),
): DraftState {
  seedIfEmpty(db);
  return db.transaction((tx) => {
    assertRevision(tx, input.revision);
    const source = tx
      .select()
      .from(publishedVersions)
      .where(eq(publishedVersions.version, input.version))
      .get();
    if (!source) throw new VersionNotFoundError(input.version);
    const document = parseDocument(source.document, `게시 버전 ${source.version}`);
    const current = readDraftRow(tx);
    tx.update(siteDraft)
      .set({
        document,
        restoredFrom: source.version,
        revision: current.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(siteDraft.id, 1))
      .run();
    return buildDraftState(tx);
  });
}

export interface PublishedRecord {
  version: number;
  document: SiteDocument;
  publishedAt: Date;
}

/** 가장 최근 게시본. 게시한 적이 없으면 null. */
export function getLatestPublished(db: AppDatabase = getDb()): PublishedRecord | null {
  seedIfEmpty(db);
  const row = readLatestRow(db);
  if (!row) return null;
  return {
    version: row.version,
    document: parseDocument(row.document, `게시 버전 ${row.version}`),
    publishedAt: row.publishedAt,
  };
}
