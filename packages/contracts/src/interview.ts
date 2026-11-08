import { z } from "zod";
import { BlockSchema } from "./blocks";
import { IdSchema } from "./primitives";

/*
 * 면접 노트 (어드민 전용).
 * 기술면접에서 받을 만한 질문과 답을 포트폴리오 프로젝트별로(또는 공통으로) 정리해 두는 곳이다.
 * SiteDocument와 따로 저장하므로 게시·버전 관리 대상이 아니고, 공개 API로는 절대 나가지 않는다.
 */

export const INTERVIEW_STATUSES = ["todo", "discussing", "done"] as const;
export const InterviewStatusSchema = z.enum(INTERVIEW_STATUSES);
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;

export const interviewStatusLabels: Record<InterviewStatus, string> = {
  todo: "정리 전",
  discussing: "논의 중",
  done: "정리 완료",
};

/** 노트 종류: 면접 질문, 또는 답변에 나오는 용어 */
export const INTERVIEW_NOTE_KINDS = ["question", "term"] as const;
export const InterviewNoteKindSchema = z.enum(INTERVIEW_NOTE_KINDS);
export type InterviewNoteKind = z.infer<typeof InterviewNoteKindSchema>;

export const MAX_INTERVIEW_NOTES = 300;
/** 질문 하나에 둘 수 있는 답의 수 */
export const MAX_INTERVIEW_ANSWERS = 10;

/**
 * 질문에 대한 답 하나. 같은 질문에 쓰임새가 다른 답(1분 / 30초 / 회사별 등)을 나란히 둔다.
 * 목록의 첫 번째가 대표 답이다(훑어보기에서 먼저 보인다).
 */
export const InterviewAnswerSchema = z.object({
  id: IdSchema,
  /** 이름표: "기본", "30초", "스타트업용" 등 */
  label: z.string().trim().min(1).max(30),
  text: z.string().trim().max(2000),
});
export type InterviewAnswer = z.infer<typeof InterviewAnswerSchema>;

export const InterviewAnswersSchema = z
  .array(InterviewAnswerSchema)
  .max(MAX_INTERVIEW_ANSWERS)
  .refine((answers) => new Set(answers.map((a) => a.id)).size === answers.length, {
    message: "답 ID가 중복됩니다.",
  });

/** 편집할 수 있는 필드 */
export const InterviewNoteInputSchema = z.object({
  /** question: 면접 질문, term: 용어집 항목. 만든 뒤에는 바꾸지 않는다. */
  kind: InterviewNoteKindSchema.default("question"),
  /** 질문이면 질문 문장, 용어면 용어 이름 */
  question: z.string().trim().min(1).max(300),
  /** 용어의 한 줄 정의. 질문은 쓰지 않는다(답은 answers에 둔다). */
  summary: z.string().trim().max(2000).default(""),
  /** 질문의 답들. 첫 번째가 대표 답. 용어는 쓰지 않는다. */
  answers: InterviewAnswersSchema.default([]),
  /** 질문이면 자세한 답변·코드 근거·꼬리질문, 용어면 쉬운 설명과 이 프로젝트에서의 예 (블록 본문) */
  body: z.array(BlockSchema),
  status: InterviewStatusSchema,
  /**
   * 이 질문이 다루는 포트폴리오 프로젝트(content.projects의 ID). null이면 공통 질문.
   * 프로젝트는 사이트 문서 안에 있어 외래 키가 없다. 프로젝트를 지워도 노트는 남고 "삭제된 프로젝트"로 보인다.
   */
  projectId: IdSchema.nullable().default(null),
});
export type InterviewNoteInput = z.infer<typeof InterviewNoteInputSchema>;

export const InterviewNoteSchema = InterviewNoteInputSchema.extend({
  id: z.string().min(1),
  /** 목록 순서 (0부터) */
  position: z.number().int().nonnegative(),
  /** 저장할 때마다 1씩 증가. 다른 탭의 변경을 덮어쓰지 않도록 수정 요청에 함께 보낸다. */
  revision: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type InterviewNote = z.infer<typeof InterviewNoteSchema>;

// ── 관리자 API 요청·응답 (/api/admin/interview*) ─────────

export const CreateInterviewNoteRequestSchema = InterviewNoteInputSchema;

export const UpdateInterviewNoteRequestSchema = InterviewNoteInputSchema.extend({
  revision: z.number().int().positive(),
});
export type UpdateInterviewNoteRequest = z.infer<typeof UpdateInterviewNoteRequestSchema>;

/** 전체 노트 ID를 새 순서대로 보낸다. 빠지거나 없는 ID가 있으면 거부한다. */
export const ReorderInterviewNotesRequestSchema = z.object({
  ids: z.array(z.string().min(1)).max(MAX_INTERVIEW_NOTES),
});

export const InterviewNoteResponseSchema = z.object({ note: InterviewNoteSchema });
export const InterviewNoteListResponseSchema = z.object({ notes: z.array(InterviewNoteSchema) });

export const interviewApiPaths = {
  list: "/api/admin/interview",
  item: (id: string) => `/api/admin/interview/${encodeURIComponent(id)}`,
  order: "/api/admin/interview/order",
} as const;
