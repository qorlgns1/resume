import path from "node:path";
import type { SiteDocument } from "@resume/contracts";
import { sampleSiteDocument } from "@resume/contracts/samples";
import { beforeEach, describe, expect, it } from "vitest";
import { type AppDatabase, openDatabase } from "./db/open";
import {
  ConflictError,
  getDraftState,
  getLatestPublished,
  listVersions,
  NothingToPublishError,
  publishDraft,
  restoreVersion,
  saveDraft,
  seedIfEmpty,
  VersionNotFoundError,
} from "./site-repository";

/*
 * 메모리 SQLite에 실제 마이그레이션을 적용해서 저장소 함수를 그대로 돌린다.
 * 외부 상태(파일, 환경 변수)에 기대지 않으므로 테스트마다 새 DB를 쓴다.
 */

const migrationsDir = path.resolve(__dirname, "../../drizzle");

function renamed(document: SiteDocument, name: string): SiteDocument {
  return { ...document, site: { ...document.site, title: name } };
}

describe("site-repository", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = openDatabase(":memory:", migrationsDir).db;
  });

  it("seeds the sample document as draft and version 1 exactly once", () => {
    expect(seedIfEmpty(db)).toBe(true);
    expect(seedIfEmpty(db)).toBe(false);
    const state = getDraftState(db);
    expect(state.revision).toBe(1);
    expect(state.latestVersion).toBe(1);
    expect(state.hasUnpublishedChanges).toBe(false);
    expect(getLatestPublished(db)?.version).toBe(1);
    expect(listVersions(db)).toHaveLength(1);
  });

  it("saves a draft, bumps the revision, and reports unpublished changes", () => {
    const before = getDraftState(db);
    const after = saveDraft(
      { revision: before.revision, document: renamed(before.document, "바뀐 이름") },
      db,
    );
    expect(after.revision).toBe(before.revision + 1);
    expect(after.hasUnpublishedChanges).toBe(true);
    expect(after.document.site.title).toBe("바뀐 이름");
    // 게시본은 그대로다.
    expect(getLatestPublished(db)?.document.site.title).toBe(before.document.site.title);
  });

  it("rejects a save whose revision is stale with the current revision attached", () => {
    const state = getDraftState(db);
    saveDraft({ revision: state.revision, document: renamed(state.document, "첫 저장") }, db);
    let error: unknown;
    try {
      saveDraft({ revision: state.revision, document: renamed(state.document, "둘째 저장") }, db);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).currentRevision).toBe(state.revision + 1);
    // 늦게 온 저장은 덮어쓰지 않는다.
    expect(getDraftState(db).document.site.title).toBe("첫 저장");
  });

  it("treats a document with reordered keys as unchanged", () => {
    const state = getDraftState(db);
    const { site, content, pages } = state.document;
    const reordered = { pages, content, site } as SiteDocument;
    const after = saveDraft({ revision: state.revision, document: reordered }, db);
    expect(after.hasUnpublishedChanges).toBe(false);
  });

  it("refuses to publish when the draft equals the latest version", () => {
    const state = getDraftState(db);
    expect(() => publishDraft({ revision: state.revision }, db)).toThrow(NothingToPublishError);
  });

  it("publishes the draft as the next version and clears the unpublished flag", () => {
    const state = getDraftState(db);
    const saved = saveDraft(
      { revision: state.revision, document: renamed(state.document, "게시할 이름") },
      db,
    );
    const { published, draft } = publishDraft(
      { revision: saved.revision, note: "  첫 게시  " },
      db,
    );
    expect(published.version).toBe(2);
    expect(published.note).toBe("첫 게시");
    expect(published.restoredFrom).toBeNull();
    expect(draft.latestVersion).toBe(2);
    expect(draft.hasUnpublishedChanges).toBe(false);
    expect(draft.revision).toBe(saved.revision + 1);
    expect(getLatestPublished(db)?.document.site.title).toBe("게시할 이름");
    expect(listVersions(db).map((v) => v.version)).toEqual([2, 1]);
  });

  it("restores an old version into the draft without publishing it", () => {
    const state = getDraftState(db);
    const saved = saveDraft(
      { revision: state.revision, document: renamed(state.document, "버전 2") },
      db,
    );
    const { draft: afterPublish } = publishDraft({ revision: saved.revision }, db);

    const restored = restoreVersion({ version: 1, revision: afterPublish.revision }, db);
    expect(restored.document.site.title).toBe(state.document.site.title);
    expect(restored.restoredFrom).toBe(1);
    expect(restored.hasUnpublishedChanges).toBe(true);
    expect(getLatestPublished(db)?.version).toBe(2);

    const { published } = publishDraft({ revision: restored.revision }, db);
    expect(published.version).toBe(3);
    expect(published.restoredFrom).toBe(1);
    expect(getDraftState(db).restoredFrom).toBeNull();
  });

  it("rejects restoring a version that does not exist", () => {
    const state = getDraftState(db);
    expect(() => restoreVersion({ version: 99, revision: state.revision }, db)).toThrow(
      VersionNotFoundError,
    );
  });

  it("validates the document before saving", () => {
    const state = getDraftState(db);
    const broken = {
      ...state.document,
      content: { ...state.document.content, projects: [] },
    } as SiteDocument;
    expect(() => saveDraft({ revision: state.revision, document: broken }, db)).toThrow();
    expect(getDraftState(db).document).toEqual(state.document);
  });

  it("keeps the published document identical to the sample it was seeded from", () => {
    const published = getLatestPublished(db);
    expect(published?.document.site.title).toBe(sampleSiteDocument.site.title);
  });
});
