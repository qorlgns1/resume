import path from "node:path";
import type { InterviewNoteInput } from "@resume/contracts";
import { beforeEach, describe, expect, it } from "vitest";
import { type AppDatabase, openDatabase } from "./db/open";
import { mediaAssets } from "./db/schema";
import {
  createInterviewNote,
  deleteInterviewNote,
  InterviewNoteConflictError,
  InterviewNoteNotFoundError,
  InterviewRequestError,
  listInterviewNotes,
  reorderInterviewNotes,
  updateInterviewNote,
} from "./interview-repository";
import { deleteMedia, listMedia, MediaInUseError } from "./media-store";

/*
 * 메모리 SQLite에 실제 마이그레이션을 적용해서 면접 노트 저장소를 그대로 돌린다.
 */

const migrationsDir = path.resolve(__dirname, "../../drizzle");

function note(question: string, extra: Partial<InterviewNoteInput> = {}): InterviewNoteInput {
  return {
    kind: "question",
    question,
    summary: "",
    body: [],
    status: "todo",
    projectId: null,
    ...extra,
  };
}

describe("interview-repository", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = openDatabase(":memory:", migrationsDir).db;
  });

  it("starts empty and appends new notes in order", () => {
    expect(listInterviewNotes(db)).toEqual([]);
    const first = createInterviewNote(note("  문서 스냅샷을 고른 이유  "), db);
    const second = createInterviewNote(note("낙관적 잠금"), db);
    expect(first.question).toBe("문서 스냅샷을 고른 이유");
    expect(first.revision).toBe(1);
    expect([first.position, second.position]).toEqual([0, 1]);
    expect(listInterviewNotes(db).map((n) => n.question)).toEqual([
      "문서 스냅샷을 고른 이유",
      "낙관적 잠금",
    ]);
  });

  it("updates a note, keeps the block body, and bumps the revision", () => {
    const created = createInterviewNote(note("질문"), db);
    const updated = updateInterviewNote(
      created.id,
      {
        revision: created.revision,
        ...note("질문", {
          summary: "30초 답변",
          status: "done",
          body: [{ id: "b1", type: "paragraph", text: [{ text: "근거" }] }],
        }),
      },
      db,
    );
    expect(updated.revision).toBe(2);
    expect(updated.status).toBe("done");
    expect(updated.summary).toBe("30초 답변");
    expect(listInterviewNotes(db)[0]?.body).toEqual([
      { id: "b1", type: "paragraph", text: [{ text: "근거" }] },
    ]);
  });

  it("links a note to a portfolio project and back to common", () => {
    const created = createInterviewNote(
      note("단어장 검색은 어떻게 만들었나요?", { projectId: "prj_words" }),
      db,
    );
    expect(created.projectId).toBe("prj_words");
    const common = updateInterviewNote(created.id, { revision: 1, ...note("공통 질문") }, db);
    expect(common.projectId).toBeNull();
    // 프로젝트 ID는 사이트 문서의 ID 형식을 따른다
    expect(() => createInterviewNote(note("x", { projectId: "공백 있는 id" }), db)).toThrow();
  });

  it("keeps a term as a term even if an update says otherwise", () => {
    const term = createInterviewNote(
      note("스냅샷", { kind: "term", summary: "어느 한 시점의 전체 상태를 통째로 저장한 사본" }),
      db,
    );
    expect(term.kind).toBe("term");
    const updated = updateInterviewNote(
      term.id,
      { revision: 1, ...note("스냅샷", { kind: "question" }) },
      db,
    );
    expect(updated.kind).toBe("term");
  });

  it("rejects an update based on a stale revision", () => {
    const created = createInterviewNote(note("질문"), db);
    updateInterviewNote(created.id, { revision: 1, ...note("다른 탭에서 고침") }, db);
    expect(() => updateInterviewNote(created.id, { revision: 1, ...note("덮어쓰기") }, db)).toThrow(
      InterviewNoteConflictError,
    );
    expect(listInterviewNotes(db)[0]?.question).toBe("다른 탭에서 고침");
  });

  it("rejects invalid input", () => {
    expect(() => createInterviewNote(note("   "), db)).toThrow();
    expect(() => createInterviewNote(note("x".repeat(301)), db)).toThrow();
  });

  it("deletes a note and reports missing ones", () => {
    const created = createInterviewNote(note("질문"), db);
    deleteInterviewNote(created.id, db);
    expect(listInterviewNotes(db)).toEqual([]);
    expect(() => deleteInterviewNote(created.id, db)).toThrow(InterviewNoteNotFoundError);
    expect(() => updateInterviewNote("iv_missing", { revision: 1, ...note("x") }, db)).toThrow(
      InterviewNoteNotFoundError,
    );
  });

  it("reorders notes only when given exactly the current ids", () => {
    const a = createInterviewNote(note("A"), db);
    const b = createInterviewNote(note("B"), db);
    const c = createInterviewNote(note("C"), db);
    expect(reorderInterviewNotes([c.id, a.id, b.id], db).map((n) => n.question)).toEqual([
      "C",
      "A",
      "B",
    ]);
    // 빠진 ID, 없는 ID, 중복 ID는 거부하고 순서는 그대로다
    expect(() => reorderInterviewNotes([a.id, b.id], db)).toThrow(InterviewRequestError);
    expect(() => reorderInterviewNotes([a.id, b.id, "iv_x"], db)).toThrow(InterviewRequestError);
    expect(() => reorderInterviewNotes([a.id, a.id, b.id], db)).toThrow(InterviewRequestError);
    expect(listInterviewNotes(db).map((n) => n.question)).toEqual(["C", "A", "B"]);
    // 순서를 바꾼 뒤 새로 만든 노트는 맨 뒤에 붙는다
    createInterviewNote(note("D"), db);
    expect(listInterviewNotes(db).map((n) => n.question)).toEqual(["C", "A", "B", "D"]);
  });

  it("marks images used in a note as in use so they cannot be deleted", async () => {
    const assetId = "med_0123456789abcdef";
    db.insert(mediaAssets)
      .values({
        id: assetId,
        originalName: "diagram.png",
        width: 960,
        height: 540,
        widths: [480, 960],
        bytes: 1000,
      })
      .run();
    expect(listMedia(db)[0]?.usage).toEqual({ draft: false, versions: [], interview: false });

    createInterviewNote(
      note("구조도가 있는 질문", {
        body: [
          {
            id: "b1",
            type: "image",
            media: {
              id: "m1",
              kind: "image",
              assetId,
              alt: "",
              width: 960,
              height: 540,
              widths: [480, 960],
            },
          },
        ],
      }),
      db,
    );
    expect(listMedia(db)[0]?.usage.interview).toBe(true);
    await expect(deleteMedia(assetId, db)).rejects.toThrow(MediaInUseError);
  });
});
