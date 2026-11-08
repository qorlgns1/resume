import "server-only";
import { randomUUID } from "node:crypto";
import {
  BlockSchema,
  type InterviewNote,
  type InterviewNoteInput,
  InterviewNoteInputSchema,
  MAX_INTERVIEW_NOTES,
  type UpdateInterviewNoteRequest,
} from "@resume/contracts";
import { asc, count, eq, max } from "drizzle-orm";
import { z } from "zod";
import { type AppDatabase, getDb } from "./db/client";
import { interviewNotes } from "./db/schema";

/*
 * 면접 노트 저장소 (어드민 전용).
 * - 노트마다 revision을 두어, 다른 탭에서 먼저 고친 노트를 덮어쓰지 않는다 (사이트 초안과 같은 낙관적 잠금).
 * - 본문은 Block[] JSON이며 읽고 쓸 때 검증한다.
 */

export class InterviewNoteNotFoundError extends Error {
  constructor() {
    super("면접 노트를 찾을 수 없습니다.");
  }
}

export class InterviewNoteConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super("다른 곳에서 이 노트가 먼저 바뀌었습니다.");
  }
}

/** 요청이 저장소 규칙에 맞지 않음 (순서 목록 불일치, 개수 초과) */
export class InterviewRequestError extends Error {}

type Row = typeof interviewNotes.$inferSelect;
type Tx = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];
type Reader = AppDatabase | Tx;

const StoredBodySchema = z.array(BlockSchema);

function toNote(row: Row): InterviewNote {
  const body = StoredBodySchema.safeParse(row.body);
  if (!body.success) {
    throw new Error(`면접 노트 ${row.id}의 본문이 계약과 다릅니다: ${body.error.message}`);
  }
  return {
    id: row.id,
    kind: row.kind,
    position: row.position,
    question: row.question,
    summary: row.summary,
    body: body.data,
    status: row.status,
    projectId: row.projectId,
    revision: row.revision,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function listInterviewNotes(db: Reader = getDb()): InterviewNote[] {
  return db
    .select()
    .from(interviewNotes)
    .orderBy(asc(interviewNotes.position), asc(interviewNotes.createdAt))
    .all()
    .map(toNote);
}

/** 새 노트를 목록 맨 뒤에 만든다. */
export function createInterviewNote(
  input: InterviewNoteInput,
  db: AppDatabase = getDb(),
): InterviewNote {
  const value = InterviewNoteInputSchema.parse(input);
  return db.transaction((tx) => {
    const stats = tx
      .select({ total: count(), last: max(interviewNotes.position) })
      .from(interviewNotes)
      .get();
    const total = stats?.total ?? 0;
    const last = stats?.last ?? null;
    if (total >= MAX_INTERVIEW_NOTES) {
      throw new InterviewRequestError(`면접 노트는 ${MAX_INTERVIEW_NOTES}개까지 만들 수 있습니다.`);
    }
    const row = tx
      .insert(interviewNotes)
      .values({
        id: `iv_${randomUUID()}`,
        kind: value.kind,
        position: last === null ? 0 : last + 1,
        question: value.question,
        summary: value.summary,
        body: value.body,
        status: value.status,
        projectId: value.projectId,
      })
      .returning()
      .get();
    return toNote(row);
  });
}

/** 노트를 고친다. revision이 현재 값과 다르면 InterviewNoteConflictError. 종류(kind)는 바꾸지 않는다. */
export function updateInterviewNote(
  id: string,
  input: UpdateInterviewNoteRequest,
  db: AppDatabase = getDb(),
): InterviewNote {
  const value = InterviewNoteInputSchema.parse(input);
  return db.transaction((tx) => {
    const current = tx.select().from(interviewNotes).where(eq(interviewNotes.id, id)).get();
    if (!current) throw new InterviewNoteNotFoundError();
    if (current.revision !== input.revision) {
      throw new InterviewNoteConflictError(current.revision);
    }
    const row = tx
      .update(interviewNotes)
      .set({
        question: value.question,
        summary: value.summary,
        body: value.body,
        status: value.status,
        projectId: value.projectId,
        revision: current.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(interviewNotes.id, id))
      .returning()
      .get();
    return toNote(row);
  });
}

export function deleteInterviewNote(id: string, db: AppDatabase = getDb()): void {
  const removed = db.delete(interviewNotes).where(eq(interviewNotes.id, id)).returning().all();
  if (removed.length === 0) throw new InterviewNoteNotFoundError();
}

/** 전체 노트 ID를 새 순서대로 받아 position을 다시 매긴다. */
export function reorderInterviewNotes(ids: string[], db: AppDatabase = getDb()): InterviewNote[] {
  return db.transaction((tx) => {
    const existing = tx.select({ id: interviewNotes.id }).from(interviewNotes).all();
    const known = new Set(existing.map((r) => r.id));
    const requested = new Set(ids);
    const sameSet =
      requested.size === ids.length &&
      requested.size === known.size &&
      ids.every((id) => known.has(id));
    if (!sameSet) {
      throw new InterviewRequestError("목록이 바뀌었습니다. 새로고침한 뒤 다시 옮겨 주세요.");
    }
    ids.forEach((id, position) => {
      tx.update(interviewNotes).set({ position }).where(eq(interviewNotes.id, id)).run();
    });
    return listInterviewNotes(tx);
  });
}
