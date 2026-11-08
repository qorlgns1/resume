"use client";

import {
  ADMIN_MEDIA_BASE,
  type InterviewNote,
  type InterviewStatus,
  interviewStatusLabels,
} from "@resume/contracts";
import { BlockContent } from "@resume/modules";
import { Badge } from "@resume/ui/components/badge";
import { Button } from "@resume/ui/components/button";
import { Input } from "@resume/ui/components/input";
import { cn } from "@resume/ui/lib/utils";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

/*
 * 면접 노트 훑어보기. 한 화면에 하나만 보여준다.
 * - 왼쪽: 프로젝트 선택, 질문(전체를 고르면 프로젝트별로 묶음) / 용어집(가나다순, 검색) 목차
 * - 오른쪽: 고른 질문의 30초 답변과 자세한 답변, 또는 용어 설명
 * - ←/→ 이전·다음, "답 가리기"를 켜면 먼저 답해 보고 Space로 펼친다(연습용)
 */

type Section = "question" | "term";

export const statusBadge: Record<InterviewStatus, "outline" | "warning" | "success"> = {
  todo: "outline",
  discussing: "warning",
  done: "success",
};

interface ReviewViewProps {
  /** 보여줄 노트 (질문과 용어가 섞여 있다) */
  notes: InterviewNote[];
  projectTitle: (id: string | null) => string;
  /** 목차 맨 위의 프로젝트 선택 (편집 화면과 같은 값을 쓴다) */
  projectFilter: ReactNode;
  /** 한 프로젝트(또는 공통)를 골랐으면 그 이름. 전체면 null */
  projectLabel: string | null;
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function ReviewView({ notes, projectTitle, projectFilter, projectLabel }: ReviewViewProps) {
  const questions = useMemo(() => notes.filter((n) => n.kind === "question"), [notes]);
  const allTerms = useMemo(
    () =>
      notes
        .filter((n) => n.kind === "term")
        .sort((a, b) => a.question.localeCompare(b.question, "ko")),
    [notes],
  );
  const [section, setSection] = useState<Section>(questions.length > 0 ? "question" : "term");
  const [query, setQuery] = useState("");
  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTerms;
    return allTerms.filter(
      (t) => t.question.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q),
    );
  }, [allTerms, query]);
  const items = section === "question" ? questions : terms;

  const [currentId, setCurrentId] = useState<string | null>(items[0]?.id ?? null);
  const index = Math.max(
    0,
    items.findIndex((n) => n.id === currentId),
  );
  const current = items[index] ?? null;

  const [hideAnswers, setHideAnswers] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const answerVisible = !hideAnswers || revealed;

  const contentRef = useRef<HTMLDivElement>(null);
  const go = (id: string | undefined) => {
    if (!id) return;
    setCurrentId(id);
    setRevealed(false);
    contentRef.current?.scrollTo({ top: 0 });
  };
  const changeSection = (next: Section) => {
    setSection(next);
    const list = next === "question" ? questions : terms;
    go(list[0]?.id);
  };

  // ←/→로 이전·다음, Space로 가린 답 펼치기. 입력칸에서 타이핑할 때는 무시한다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: 매 렌더 최신 목록과 위치로 다시 건다.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowRight") go(items[index + 1]?.id);
      else if (event.key === "ArrowLeft") go(items[index - 1]?.id);
      else if (event.key === " " && hideAnswers && !revealed) {
        event.preventDefault();
        setRevealed(true);
      } else return;
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items, index, hideAnswers, revealed]);

  // 질문을 프로젝트별로 묶는다 (처음 나온 순서대로). 번호는 전체에서 이어진다.
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; items: { note: InterviewNote; n: number }[] }>();
    questions.forEach((note, i) => {
      const key = note.projectId ?? "";
      const group = map.get(key) ?? { title: projectTitle(note.projectId), items: [] };
      group.items.push({ note, n: i + 1 });
      map.set(key, group);
    });
    return [...map.values()];
  }, [questions, projectTitle]);

  // 비어 있어도 목차(프로젝트 선택)는 그린다. 다른 프로젝트로 바꿀 수 있어야 한다.

  const noun = section === "question" ? "질문" : "용어";
  const prev = items[index - 1];
  const next = items[index + 1];
  const tocButton = (note: InterviewNote, label: string) => (
    <button
      type="button"
      aria-current={note.id === current?.id ? "true" : undefined}
      onClick={() => go(note.id)}
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-body-sm hover:bg-muted",
        note.id === current?.id && "bg-primary-soft font-semibold hover:bg-primary-soft",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          note.status === "done"
            ? "bg-success"
            : note.status === "discussing"
              ? "bg-warning"
              : "border border-border-strong",
        )}
      />
      <span className="line-clamp-2">{label}</span>
    </button>
  );

  return (
    <div className="row-start-3 grid min-h-0 grid-cols-[20rem_minmax(0,1fr)]">
      <nav
        aria-label="훑어보기 목차"
        className="flex min-h-0 flex-col gap-3 border-r border-border bg-card p-3"
      >
        {projectFilter}
        <fieldset className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
          <legend className="sr-only">보기</legend>
          {(
            [
              { value: "question", label: `질문 (${questions.length})` },
              { value: "term", label: `용어집 (${allTerms.length})` },
            ] as const
          ).map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={section === value}
              onClick={() => changeSection(value)}
              className={cn(
                "text-muted-foreground",
                section === value && "bg-card text-foreground shadow-card hover:bg-card",
              )}
            >
              {label}
            </Button>
          ))}
        </fieldset>
        {section === "term" ? (
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground"
            />
            <Input
              type="search"
              aria-label="용어 찾기"
              placeholder="용어 찾기"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setRevealed(false);
              }}
              className="bg-background pl-8"
            />
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {section === "question" ? (
            groups.map((group) => (
              <div key={group.title} className="flex flex-col gap-0.5">
                {projectLabel === null ? (
                  <span className="px-2 text-caption font-semibold text-muted-foreground">
                    {group.title}
                  </span>
                ) : null}
                <ol className="flex flex-col gap-0.5">
                  {group.items.map(({ note, n }) => (
                    <li key={note.id}>{tocButton(note, `${n}. ${note.question}`)}</li>
                  ))}
                </ol>
              </div>
            ))
          ) : terms.length > 0 ? (
            <ul className="flex flex-col gap-0.5">
              {terms.map((note) => (
                <li key={note.id}>{tocButton(note, note.question)}</li>
              ))}
            </ul>
          ) : (
            <p className="px-2 text-body-sm text-muted-foreground">
              {allTerms.length === 0 ? "아직 용어가 없습니다." : "찾는 용어가 없습니다."}
            </p>
          )}
        </div>
      </nav>

      <div ref={contentRef} className="min-h-0 overflow-y-auto bg-background">
        {current ? (
          <article className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-caption text-subtle-foreground">
                <span className="tabular-nums" data-testid="review-position">
                  {section === "question" && projectLabel ? `${projectLabel} ` : ""}
                  {noun} {index + 1} / {items.length}
                </span>
                <Badge variant="secondary" className="rounded-sm">
                  {projectTitle(current.projectId)}
                </Badge>
                <Badge variant={statusBadge[current.status]} className="rounded-sm">
                  {interviewStatusLabels[current.status]}
                </Badge>
              </span>
              <Button
                size="sm"
                variant="outline"
                aria-pressed={hideAnswers}
                onClick={() => {
                  setHideAnswers((v) => !v);
                  setRevealed(false);
                }}
                title="먼저 소리 내어 답해 본 뒤 펼쳐 보는 연습 모드"
              >
                {hideAnswers ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                {hideAnswers ? "답 보이기" : "답 가리기"}
              </Button>
            </div>

            <h2 className="text-heading font-extrabold tracking-tight">{current.question}</h2>

            {answerVisible ? (
              <>
                {current.summary ? (
                  <section aria-label={section === "question" ? "30초 답변" : "한 줄 정의"}>
                    <p className="mb-1.5 text-caption font-semibold text-primary-text">
                      {section === "question" ? "30초 답변" : "한 줄 정의"}
                    </p>
                    <p className="rounded-md border-l-4 border-primary bg-primary-soft px-5 py-4 text-body leading-relaxed whitespace-pre-line">
                      {current.summary}
                    </p>
                  </section>
                ) : (
                  <p className="text-body-sm text-muted-foreground">
                    {section === "question" ? "30초 답변" : "한 줄 정의"}을 아직 적지 않았습니다.
                  </p>
                )}
                {current.body.length > 0 ? (
                  <BlockContent
                    className="rs-interview-body"
                    blocks={current.body}
                    options={{ mediaBase: ADMIN_MEDIA_BASE }}
                  />
                ) : null}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-10 text-center">
                <p className="text-body text-muted-foreground">
                  먼저 소리 내어 답해 보세요. 준비되면 답을 펼칩니다.
                </p>
                <Button onClick={() => setRevealed(true)}>
                  <Eye aria-hidden="true" />답 보기
                  <kbd className="rounded-xs bg-primary-foreground/20 px-1 font-mono text-caption">
                    Space
                  </kbd>
                </Button>
              </div>
            )}

            <nav
              aria-label="이전·다음"
              className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-5"
            >
              {prev ? (
                <Button
                  variant="ghost"
                  className="h-auto justify-start py-2 text-left whitespace-normal"
                  onClick={() => go(prev.id)}
                >
                  <ArrowLeft aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="text-caption text-subtle-foreground">이전 (←)</span>
                    <span className="line-clamp-1">{prev.question}</span>
                  </span>
                </Button>
              ) : (
                <span />
              )}
              {next ? (
                <Button
                  variant="ghost"
                  className="h-auto justify-end py-2 text-right whitespace-normal"
                  onClick={() => go(next.id)}
                >
                  <span className="flex flex-col">
                    <span className="text-caption text-subtle-foreground">다음 (→)</span>
                    <span className="line-clamp-1">{next.question}</span>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : null}
            </nav>
          </article>
        ) : (
          <p className="px-8 py-10 text-body-sm text-muted-foreground">
            {section === "question"
              ? `${projectLabel ?? "이 범위"}에 아직 질문이 없습니다. 편집에서 질문을 추가하세요.`
              : "찾는 용어가 없습니다."}
          </p>
        )}
      </div>
    </div>
  );
}
