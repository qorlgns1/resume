"use client";

import {
  configureKoreanErrors,
  INTERVIEW_STATUSES,
  type InterviewNote,
  type InterviewNoteInput,
  InterviewNoteInputSchema,
  type InterviewNoteKind,
  type InterviewStatus,
  interviewStatusLabels,
  MAX_INTERVIEW_COMPANY_LENGTH,
} from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { Button, buttonVariants } from "@resume/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@resume/ui/components/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@resume/ui/components/field";
import { Input } from "@resume/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resume/ui/components/select";
import { Textarea } from "@resume/ui/components/textarea";
import { cn } from "@resume/ui/lib/utils";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Pencil, Plus, Save, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminApiError, adminApi } from "../editor/api-client";
import { MediaLibraryProvider, useMediaLibrary } from "../editor/media-library";
import { SignOutButton } from "../editor/sign-out-button";
import { AnswersEditor } from "./answers-editor";
import { ReviewView, statusBadge } from "./review-view";

configureKoreanErrors();

// 블록 편집기는 브라우저 전용이고 용량이 커서 필요할 때만 불러온다.
const BlockEditor = dynamic(
  () => import("../block-editor/block-editor").then((m) => m.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <p className="px-1 py-8 text-body-sm text-muted-foreground">편집기를 불러오는 중…</p>
    ),
  },
);

type Mode = "edit" | "review";
type Feedback = { kind: "success" | "error"; message: string; conflict?: boolean } | null;

const statusOptions = INTERVIEW_STATUSES.map((value) => ({
  value,
  label: interviewStatusLabels[value],
}));

function toInput(note: InterviewNote): InterviewNoteInput {
  return {
    kind: note.kind,
    question: note.question,
    summary: note.summary,
    answers: note.answers,
    body: note.body,
    status: note.status,
    projectId: note.projectId,
    company: note.company,
  };
}

/** 연결할 수 있는 포트폴리오 프로젝트 (초안 기준) */
export interface InterviewProjectOption {
  id: string;
  title: string;
}

/** 목록 필터: 전체, 공통 질문, 또는 프로젝트 ID */
type Filter = "all" | "common" | (string & {});
// Radix Select는 빈 값을 쓸 수 없어 공통 질문을 이 값으로 나타낸다.
const COMMON = "common";

function inProject(note: InterviewNote, filter: Filter) {
  if (filter === "all") return true;
  if (filter === COMMON) return note.projectId === null;
  return note.projectId === filter;
}

/** 지원 회사 필터: 전체, 회사 무관(빈 회사), 또는 "co:회사 이름" */
type CompanyFilter = "all" | "none" | `co:${string}`;
const companyValue = (name: string): CompanyFilter => `co:${name}`;

/** 회사 필터는 질문에만 걸린다. 용어는 회사와 상관없이 늘 보인다. */
function inCompany(note: InterviewNote, filter: CompanyFilter) {
  if (note.kind === "term" || filter === "all") return true;
  if (filter === "none") return note.company === "";
  return note.company === filter.slice(3);
}

/** 편집 목록에 보이는 범위: 노트 종류 + 프로젝트 + 지원 회사 */
interface View {
  kind: InterviewNoteKind;
  filter: Filter;
  company: CompanyFilter;
}

function matches(note: InterviewNote, view: View) {
  return note.kind === view.kind && inProject(note, view.filter) && inCompany(note, view.company);
}

/** 노트 종류별 화면 문구 */
const copy = {
  question: {
    noun: "질문",
    /** 목적격 조사를 붙인 형태 */
    object: "질문을",
    title: "질문",
    summary: "답변",
    summaryHelp:
      "처음 질문을 받았을 때 바로 말할 답입니다. 1분·30초·회사별처럼 쓰임새가 다른 답을 여러 개 둘 수 있고, 맨 위 답이 대표로 훑어보기에 먼저 보입니다.",
    body: "자세한 답변 · 꼬리질문",
    bodyHelp: "코드 근거, 예상 꼬리질문과 답, 약점과 개선 계획을 적습니다.",
    editor: "자세한 답변",
    empty: "아직 질문이 없습니다. 이 프로젝트에 대해 받을 만한 질문을 추가해 보세요.",
  },
  term: {
    noun: "용어",
    object: "용어를",
    title: "용어",
    summary: "한 줄 정의",
    summaryHelp: "면접에서 한 문장으로 말할 정의입니다. 훑어보기 용어집에 함께 보입니다.",
    body: "쉬운 설명 · 이 프로젝트에서의 예",
    bodyHelp:
      "비유로 풀어 쓴 설명, 이 프로젝트의 어디에 쓰였는지, 헷갈리는 비슷한 용어를 적습니다.",
    editor: "용어 설명",
    empty: "아직 용어가 없습니다. 답변에 나오는 낯선 용어를 추가해 보세요.",
  },
} as const satisfies Record<InterviewNoteKind, Record<string, string>>;

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

interface InterviewWorkspaceProps {
  initialNotes: InterviewNote[];
  projects: InterviewProjectOption[];
  userName: string;
}

/**
 * 면접 노트 화면 (어드민 전용).
 * - 노트는 면접 질문 또는 용어집 항목이다. 목록 위의 탭으로 고른다.
 * - 노트마다 포트폴리오 프로젝트를 연결하거나 공통으로 둔다. 목록과 훑어보기를 프로젝트별로 거른다.
 * - 질문에는 지원 회사를 적을 수 있고, 목록과 훑어보기를 회사별로도 거른다.
 * - 편집: 왼쪽 목록에서 질문을 고르고 오른쪽에서 질문·답(여러 개)·본문을 고친다. 노트마다 따로 저장한다.
 * - 훑어보기: 면접 직전에 읽도록 고른 범위의 노트를 프로젝트별로 묶어 한 페이지에 보여준다.
 */
export function InterviewWorkspace(props: InterviewWorkspaceProps) {
  return (
    <MediaLibraryProvider>
      <Workspace {...props} />
    </MediaLibraryProvider>
  );
}

function Workspace({ initialNotes, projects, userName }: InterviewWorkspaceProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [view, setView] = useState<View>({ kind: "question", filter: "all", company: "all" });
  const { kind, filter, company } = view;
  const text = copy[kind];
  const visible = notes.filter((n) => matches(n, view));
  const [selectedId, setSelectedId] = useState<string | null>(
    () => initialNotes.find((n) => matches(n, view))?.id ?? null,
  );
  const selected = notes.find((n) => n.id === selectedId) ?? null;
  const [working, setWorking] = useState<InterviewNoteInput | null>(
    selected ? toInput(selected) : null,
  );
  // 서버 값으로 작업본을 바꿀 때 편집기를 새로 만든다 (편집기는 처음 내용만 받는다).
  const [editorKey, setEditorKey] = useState(0);
  const [mode, setMode] = useState<Mode>("edit");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const dirty = selected !== null && working !== null && !sameJson(working, toInput(selected));
  const issues = useMemo(() => {
    if (!working) return new Map<string, string>();
    const result = InterviewNoteInputSchema.safeParse(working);
    const map = new Map<string, string>();
    if (!result.success) {
      // 맨 위 필드("answers")와 정확한 경로("answers.0.label") 양쪽으로 찾을 수 있게 둔다.
      for (const issue of result.error.issues) {
        for (const key of [String(issue.path[0] ?? ""), issue.path.join(".")]) {
          if (!map.has(key)) map.set(key, issue.message);
        }
      }
    }
    return map;
  }, [working]);

  const open = useCallback((note: InterviewNote | null) => {
    setSelectedId(note?.id ?? null);
    setWorking(note ? toInput(note) : null);
    setWarnings([]);
    setEditorKey((k) => k + 1);
  }, []);

  const confirmDiscard = () =>
    !dirty || window.confirm("저장하지 않은 변경 사항이 있습니다. 버리고 이동할까요?");

  const run = async (task: () => Promise<string | null>) => {
    setBusy(true);
    try {
      const message = await task();
      setFeedback(message ? { kind: "success", message } : null);
    } catch (cause) {
      const conflict = cause instanceof AdminApiError && cause.status === 409;
      setFeedback({
        kind: "error",
        message: errorMessage(cause, "요청을 처리하지 못했습니다."),
        conflict,
      });
    } finally {
      setBusy(false);
    }
  };

  const replaceNote = (note: InterviewNote) =>
    setNotes((current) => current.map((n) => (n.id === note.id ? note : n)));

  const save = async () => {
    if (!selected || !working || !dirty || issues.size > 0 || busy) return;
    await run(async () => {
      const note = await adminApi.updateInterviewNote(selected.id, selected.revision, working);
      replaceNote(note);
      // 서버가 정리한 값(앞뒤 공백 제거 등)을 작업본에도 반영한다. 편집기는 그대로 둔다.
      setWorking(toInput(note));
      return "노트를 저장했습니다.";
    });
  };

  const create = async () => {
    if (!confirmDiscard()) return;
    await run(async () => {
      // 보고 있는 탭의 종류로, 프로젝트로 거르는 중이면 그 프로젝트에 연결해 만든다.
      const note = await adminApi.createInterviewNote({
        kind,
        question: `새 ${text.noun}`,
        summary: "",
        answers: kind === "question" ? [{ id: "ans_default", label: "기본", text: "" }] : [],
        body: [],
        status: "todo",
        projectId: filter === "all" || filter === COMMON ? null : filter,
        company: kind === "question" && company.startsWith("co:") ? company.slice(3) : "",
      });
      setNotes((current) => [...current, note]);
      open(note);
      setMode("edit");
      return `새 ${text.object} 만들었습니다. 내용을 고친 뒤 저장하세요.`;
    });
  };

  const remove = async () => {
    if (!selected) return;
    await run(async () => {
      await adminApi.deleteInterviewNote(selected.id);
      const index = visible.findIndex((n) => n.id === selected.id);
      const rest = visible.filter((n) => n.id !== selected.id);
      setNotes((current) => current.filter((n) => n.id !== selected.id));
      open(rest[Math.min(index, rest.length - 1)] ?? null);
      return "노트를 삭제했습니다.";
    });
  };

  /** 보이는 목록에서 바로 위·아래 노트와 자리를 바꾼다 (전체 순서에서 두 노트의 자리만 바뀐다). */
  const move = async (offset: -1 | 1) => {
    if (!selected) return;
    const neighbor = visible[visible.findIndex((n) => n.id === selected.id) + offset];
    if (!neighbor) return;
    const ids = notes.map((n) => n.id);
    const a = ids.indexOf(selected.id);
    const b = ids.indexOf(neighbor.id);
    [ids[a], ids[b]] = [neighbor.id, selected.id];
    await run(async () => {
      setNotes(await adminApi.reorderInterviewNotes(ids));
      return null;
    });
  };

  const reloadLatest = async () => {
    if (dirty && !window.confirm("저장하지 않은 변경 사항을 버리고 최신 내용을 불러올까요?"))
      return;
    await run(async () => {
      const list = await adminApi.listInterviewNotes();
      setNotes(list);
      open(list.find((n) => n.id === selectedId) ?? list.find((n) => matches(n, view)) ?? null);
      return "최신 내용을 불러왔습니다.";
    });
  };

  // 저장하지 않은 변경이 있으면 페이지를 떠날 때 경고한다.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Ctrl/⌘+S로 저장. save가 매 렌더 새로 만들어지므로 의존성 없이 매번 다시 건다.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const edit = (patch: Partial<InterviewNoteInput>) => {
    setFeedback((current) => (current?.kind === "success" ? null : current));
    setWorking((current) => (current ? { ...current, ...patch } : current));
  };

  const changeView = (patch: Partial<View>) => {
    const next = { ...view, ...patch };
    if (next.kind === kind && next.filter === filter && next.company === company) return;
    const current = selected && matches(selected, next) ? selected : null;
    if (!current && !confirmDiscard()) return;
    setView(next);
    if (!current) open(notes.find((n) => matches(n, next)) ?? null);
  };

  const projectTitle = (id: string | null) =>
    id === null ? "공통" : (projects.find((p) => p.id === id)?.title ?? "삭제된 프로젝트");
  const doneCount = visible.filter((n) => n.status === "done").length;
  const selectedIndex = selected ? visible.findIndex((n) => n.id === selected.id) : -1;
  /**
   * 프로젝트 선택. 괄호 안 개수는 지금 회사 범위의 countKind 노트 수
   * (편집: 보고 있는 탭, 훑어보기: 질문)
   */
  const projectSelect = (id: string, countKind: InterviewNoteKind) => {
    const countIn = (f: Filter) =>
      notes.filter((n) => matches(n, { kind: countKind, filter: f, company })).length;
    const options = [
      { value: "all", label: "전체", count: countIn("all") },
      { value: COMMON, label: "공통", count: countIn(COMMON) },
      ...projects.map((p) => ({ value: p.id, label: p.title, count: countIn(p.id) })),
    ];
    return (
      <Field>
        <FieldLabel htmlFor={id}>프로젝트</FieldLabel>
        <Select value={filter} onValueChange={(value) => changeView({ filter: value })}>
          <SelectTrigger id={id} className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({option.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  };
  /** 질문에 적힌 지원 회사 이름 (가나다순) */
  const companies = [
    ...new Set(notes.filter((n) => n.kind === "question" && n.company).map((n) => n.company)),
  ].sort((a, b) => a.localeCompare(b, "ko"));
  const companyLabel = company.startsWith("co:")
    ? company.slice(3)
    : company === "none"
      ? "회사 무관"
      : null;
  /** 지원 회사 선택. 괄호 안 개수는 지금 프로젝트 범위의 질문 수 */
  const companySelect = (id: string) => {
    const countIn = (c: CompanyFilter) =>
      notes.filter((n) => matches(n, { kind: "question", filter, company: c })).length;
    const names =
      company.startsWith("co:") && !companies.includes(company.slice(3))
        ? [...companies, company.slice(3)]
        : companies;
    const options = [
      { value: "all", label: "전체" },
      { value: "none", label: "회사 무관" },
      ...names.map((name) => ({ value: companyValue(name), label: name })),
    ] as const satisfies readonly { value: CompanyFilter; label: string }[];
    return (
      <Field>
        <FieldLabel htmlFor={id}>회사</FieldLabel>
        <Select
          value={company}
          onValueChange={(value) => changeView({ company: value as CompanyFilter })}
        >
          <SelectTrigger id={id} className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({countIn(option.value)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  };
  // 지운 프로젝트에 연결된 노트도 고를 수 있게 남겨 둔다.
  const projectOptions = [
    { value: COMMON, label: "공통 (프로젝트 없음)" },
    ...projects.map((p) => ({ value: p.id, label: p.title })),
    ...(working?.projectId && !projects.some((p) => p.id === working.projectId)
      ? [{ value: working.projectId, label: "삭제된 프로젝트" }]
      : []),
  ];

  return (
    <div className="grid h-dvh min-h-0 grid-rows-[auto_auto_minmax(0,1fr)]">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft aria-hidden="true" />
            편집 화면
          </Link>
          <span className="text-border-strong" aria-hidden="true">
            /
          </span>
          <h1 className="truncate text-body-sm font-semibold">면접 노트</h1>
          <Badge variant="outline" className="shrink-0 rounded-sm" data-testid="interview-progress">
            정리 완료 {doneCount} / {visible.length}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <fieldset className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            <legend className="sr-only">보기 방식</legend>
            {(
              [
                { value: "edit", label: "편집", Icon: Pencil },
                { value: "review", label: "훑어보기", Icon: BookOpen },
              ] as const
            ).map(({ value, label, Icon }) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "text-muted-foreground",
                  mode === value && "bg-card text-foreground shadow-card hover:bg-card",
                )}
              >
                <Icon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </fieldset>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <span className="text-body-sm text-muted-foreground">{userName}</span>
          <SignOutButton />
        </div>
      </header>

      <div aria-live="polite" className="empty:hidden">
        {feedback ? (
          <div
            role={feedback.kind === "error" ? "alert" : "status"}
            className={
              feedback.kind === "error"
                ? "flex items-center justify-between gap-3 bg-destructive-soft px-4 py-2 text-body-sm text-destructive"
                : "flex items-center justify-between gap-3 bg-success-soft px-4 py-2 text-body-sm text-success"
            }
          >
            <span>{feedback.message}</span>
            <span className="flex gap-2">
              {feedback.conflict ? (
                <Button size="xs" variant="outline" onClick={() => void reloadLatest()}>
                  최신 내용 불러오기
                </Button>
              ) : null}
              <Button size="xs" variant="ghost" onClick={() => setFeedback(null)}>
                닫기
              </Button>
            </span>
          </div>
        ) : null}
      </div>

      {mode === "review" ? (
        <ReviewView
          // 공통 용어는 어느 프로젝트를 골라도 용어집에 함께 보인다.
          notes={notes.filter(
            (n) =>
              (inProject(n, filter) && inCompany(n, company)) ||
              (n.kind === "term" && n.projectId === null),
          )}
          projectTitle={projectTitle}
          projectFilter={
            <div className="grid grid-cols-2 gap-2">
              {projectSelect("iv-review-filter", "question")}
              {companySelect("iv-review-company")}
            </div>
          }
          projectLabel={filter === "all" ? null : projectTitle(filter === COMMON ? null : filter)}
          companyLabel={companyLabel}
        />
      ) : (
        <div className="row-start-3 grid min-h-0 grid-cols-[20rem_minmax(0,1fr)]">
          <nav
            aria-label="면접 노트 목록"
            className="flex min-h-0 flex-col gap-2 border-r border-border bg-card p-3"
          >
            <fieldset className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
              <legend className="sr-only">노트 종류</legend>
              {(["question", "term"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-pressed={kind === value}
                  onClick={() => changeView({ kind: value })}
                  className={cn(
                    "text-muted-foreground",
                    kind === value && "bg-card text-foreground shadow-card hover:bg-card",
                  )}
                >
                  {copy[value].noun} ({notes.filter((n) => n.kind === value).length})
                </Button>
              ))}
            </fieldset>
            {kind === "question" ? (
              <div className="grid grid-cols-2 gap-2">
                {projectSelect("iv-filter", kind)}
                {companySelect("iv-company")}
              </div>
            ) : (
              projectSelect("iv-filter", kind)
            )}
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void create()}>
              <Plus aria-hidden="true" />새 {text.noun}
            </Button>
            {visible.length === 0 ? (
              <p className="px-1 py-4 text-body-sm text-muted-foreground">{text.empty}</p>
            ) : null}
            <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {visible.map((note, index) => (
                <li key={note.id}>
                  <button
                    type="button"
                    aria-current={note.id === selectedId ? "true" : undefined}
                    onClick={() => {
                      if (note.id !== selectedId && confirmDiscard()) open(note);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-body-sm hover:bg-muted",
                      note.id === selectedId && "bg-primary-soft hover:bg-primary-soft",
                    )}
                  >
                    <span className="w-5 shrink-0 text-right text-caption text-subtle-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2">{note.question}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        <Badge variant={statusBadge[note.status]} className="rounded-sm">
                          {interviewStatusLabels[note.status]}
                        </Badge>
                        {filter === "all" ? (
                          <Badge variant="secondary" className="rounded-sm">
                            {projectTitle(note.projectId)}
                          </Badge>
                        ) : null}
                        {note.company && !company.startsWith("co:") ? (
                          <Badge variant="outline" className="rounded-sm">
                            {note.company}
                          </Badge>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <main className="min-h-0 overflow-y-auto">
            {selected && working ? (
              <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption text-subtle-foreground">
                    {text.noun} {selectedIndex + 1} / {visible.length}
                    {dirty ? " · 저장하지 않은 변경" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="위로 옮기기"
                      disabled={busy || dirty || selectedIndex <= 0}
                      title={dirty ? "먼저 저장하세요." : undefined}
                      onClick={() => void move(-1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="아래로 옮기기"
                      disabled={busy || dirty || selectedIndex >= visible.length - 1}
                      title={dirty ? "먼저 저장하세요." : undefined}
                      onClick={() => void move(1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <DeleteButton
                      object={text.object}
                      question={selected.question}
                      busy={busy}
                      onConfirm={remove}
                    />
                    <Button
                      size="sm"
                      disabled={!dirty || issues.size > 0 || busy}
                      title={
                        !dirty
                          ? "저장할 변경 사항이 없습니다."
                          : issues.size > 0
                            ? "오류를 고쳐야 저장할 수 있습니다."
                            : "저장 (Ctrl/⌘+S)"
                      }
                      onClick={() => void save()}
                    >
                      <Save aria-hidden="true" />
                      저장
                    </Button>
                  </span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_10rem] gap-3">
                  <Field data-invalid={issues.has("question") ? "true" : undefined}>
                    <FieldLabel htmlFor="iv-question">{text.title}</FieldLabel>
                    <Input
                      id="iv-question"
                      value={working.question}
                      maxLength={300}
                      aria-invalid={issues.has("question") ? true : undefined}
                      className="bg-background"
                      onChange={(e) => edit({ question: e.target.value })}
                    />
                    {issues.has("question") ? (
                      <FieldError>{issues.get("question")}</FieldError>
                    ) : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="iv-status">정리 상태</FieldLabel>
                    <Select
                      value={working.status}
                      onValueChange={(value) => edit({ status: value as InterviewStatus })}
                    >
                      <SelectTrigger id="iv-status" className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="iv-project">연결한 프로젝트</FieldLabel>
                  <Select
                    value={working.projectId ?? COMMON}
                    onValueChange={(value) => edit({ projectId: value === COMMON ? null : value })}
                  >
                    <SelectTrigger id="iv-project" className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    포트폴리오의 개인 프로젝트 목록(초안 기준)에서 고릅니다. 이 서비스 전반에 대한
                    질문이면 공통으로 둡니다.
                  </FieldDescription>
                </Field>

                {kind === "question" ? (
                  <Field data-invalid={issues.has("company") ? "true" : undefined}>
                    <FieldLabel htmlFor="iv-company-name">지원 회사</FieldLabel>
                    <Input
                      id="iv-company-name"
                      value={working.company}
                      maxLength={MAX_INTERVIEW_COMPANY_LENGTH}
                      list="iv-company-names"
                      placeholder="비워 두면 회사와 상관없는 질문"
                      aria-invalid={issues.has("company") ? true : undefined}
                      className="bg-background"
                      onChange={(e) => edit({ company: e.target.value })}
                    />
                    <datalist id="iv-company-names">
                      {companies.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    <FieldDescription>
                      특정 회사 면접을 위해 준비한 질문이면 회사 이름을 적습니다. 목록과 훑어보기를
                      회사별로 거를 수 있습니다.
                    </FieldDescription>
                    {issues.has("company") ? (
                      <FieldError>{issues.get("company")}</FieldError>
                    ) : null}
                  </Field>
                ) : null}

                {kind === "question" ? (
                  <AnswersEditor
                    answers={working.answers}
                    onChange={(answers) => edit({ answers })}
                    issues={issues}
                    help={text.summaryHelp}
                  />
                ) : (
                  <Field data-invalid={issues.has("summary") ? "true" : undefined}>
                    <FieldLabel htmlFor="iv-summary">{text.summary}</FieldLabel>
                    <Textarea
                      id="iv-summary"
                      value={working.summary}
                      maxLength={2000}
                      rows={3}
                      aria-invalid={issues.has("summary") ? true : undefined}
                      className="bg-background"
                      onChange={(e) => edit({ summary: e.target.value })}
                    />
                    <FieldDescription>{text.summaryHelp}</FieldDescription>
                    {issues.has("summary") ? (
                      <FieldError>{issues.get("summary")}</FieldError>
                    ) : null}
                  </Field>
                )}

                <div className="flex flex-col gap-2">
                  <span className="text-body-sm font-medium">{text.body}</span>
                  <p className="text-caption text-muted-foreground">
                    {text.bodyHelp} <kbd className="rounded-xs bg-muted px-1 font-mono">/</kbd>로
                    제목·목록·인용·안내 상자를 넣을 수 있습니다.
                  </p>
                  {warnings.length > 0 ? (
                    <ul
                      role="status"
                      className="list-disc rounded-md bg-warning-soft py-2 pr-3 pl-7 text-caption text-warning"
                    >
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                  {issues.has("body") ? (
                    <p
                      role="alert"
                      className="rounded-md bg-destructive-soft px-3 py-2 text-caption text-destructive"
                    >
                      {issues.get("body")}
                    </p>
                  ) : null}
                  <NoteBodyEditor
                    key={`${selected.id}:${editorKey}`}
                    label={text.editor}
                    initialBlocks={working.body}
                    onChange={(blocks, nextWarnings) => {
                      setWarnings(nextWarnings);
                      edit({ body: blocks });
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="px-6 py-10 text-body-sm text-muted-foreground">
                왼쪽에서 {text.object} 고르거나 새로 추가하세요.
              </p>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function NoteBodyEditor({
  label,
  initialBlocks,
  onChange,
}: {
  label: string;
  initialBlocks: InterviewNoteInput["body"];
  onChange: (blocks: InterviewNoteInput["body"], warnings: string[]) => void;
}) {
  const { upload, lookup } = useMediaLibrary();
  return (
    <BlockEditor
      label={label}
      initialBlocks={initialBlocks}
      uploadMedia={upload}
      lookupMedia={lookup}
      onChange={(result) => onChange(result.blocks, result.warnings)}
    />
  );
}

function DeleteButton({
  object,
  question,
  busy,
  onConfirm,
}: {
  object: string;
  question: string;
  busy: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy}>
          <Trash2 aria-hidden="true" />
          삭제
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 {object} 삭제할까요?</DialogTitle>
          <DialogDescription>
            "{question}" 노트와 본문이 모두 지워집니다. 면접 노트는 버전 기록이 없어 되돌릴 수
            없습니다. (DB 백업에는 남습니다.)
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
          >
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
