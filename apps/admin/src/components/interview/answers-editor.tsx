"use client";

import { type InterviewAnswer, MAX_INTERVIEW_ANSWERS } from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { Button } from "@resume/ui/components/button";
import { FieldError } from "@resume/ui/components/field";
import { Input } from "@resume/ui/components/input";
import { Textarea } from "@resume/ui/components/textarea";
import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from "lucide-react";
import { formatSpeakingTime } from "./speaking-time";

/*
 * 질문 하나의 답 목록 편집. 같은 질문에 쓰임새가 다른 답(1분 / 30초 / 회사별)을 나란히 둔다.
 * 첫 번째 답이 대표 답이며 훑어보기에서 먼저 보인다.
 */

/** 새 답에 붙일 이름표. 아직 안 쓴 흔한 이름부터 제안한다. */
const LABEL_SUGGESTIONS = ["기본", "30초", "1분", "짧게"];

function newAnswerId() {
  return `ans_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export function nextAnswerLabel(answers: readonly InterviewAnswer[]) {
  const used = new Set(answers.map((a) => a.label));
  return LABEL_SUGGESTIONS.find((l) => !used.has(l)) ?? `답 ${answers.length + 1}`;
}

interface AnswersEditorProps {
  answers: InterviewAnswer[];
  onChange: (answers: InterviewAnswer[]) => void;
  /** 검증 오류: "answers.0.label" 같은 경로 → 메시지 */
  issues: ReadonlyMap<string, string>;
  help: string;
}

export function AnswersEditor({ answers, onChange, issues, help }: AnswersEditorProps) {
  const update = (index: number, patch: Partial<InterviewAnswer>) =>
    onChange(answers.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= answers.length) return;
    const next = [...answers];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    onChange(next);
  };
  const add = () =>
    onChange([...answers, { id: newAnswerId(), label: nextAnswerLabel(answers), text: "" }]);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-body-sm font-medium">답변</legend>
      <p className="-mt-1 text-caption text-muted-foreground">{help}</p>
      {answers.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-body-sm text-muted-foreground">
          아직 답이 없습니다. 아래 "답 추가"로 첫 답을 적어 보세요.
        </p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {answers.map((answer, index) => {
          const name = answer.label.trim() || `답 ${index + 1}`;
          const labelError = issues.get(`answers.${index}.label`);
          const textError = issues.get(`answers.${index}.text`);
          const time = formatSpeakingTime(answer.text);
          return (
            <li
              key={answer.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
              data-testid="answer-card"
            >
              <div className="flex items-center gap-2">
                {index === 0 ? (
                  <Badge variant="soft" className="shrink-0 rounded-sm">
                    대표
                  </Badge>
                ) : null}
                <Input
                  aria-label={`답 ${index + 1} 이름표`}
                  value={answer.label}
                  maxLength={30}
                  aria-invalid={labelError ? true : undefined}
                  className="h-8 w-40 bg-background text-body-sm"
                  onChange={(e) => update(index, { label: e.target.value })}
                />
                <span
                  className="ml-auto text-caption text-subtle-foreground tabular-nums"
                  data-testid="speaking-time"
                >
                  {time ? `소리 내어 읽으면 ${time}` : null}
                </span>
                {index > 0 ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => move(index, 0)}
                    title="훑어보기에서 이 답을 먼저 보여줍니다"
                  >
                    <Star aria-hidden="true" />
                    대표로
                  </Button>
                ) : null}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`${name} 답을 위로`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`${name} 답을 아래로`}
                  disabled={index === answers.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="text-destructive"
                  aria-label={`${name} 답 삭제`}
                  onClick={() => onChange(answers.filter((_, i) => i !== index))}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              {labelError ? <FieldError>{labelError}</FieldError> : null}
              <Textarea
                aria-label={`답변 · ${name}`}
                value={answer.text}
                maxLength={2000}
                rows={index === 0 ? 6 : 4}
                aria-invalid={textError ? true : undefined}
                className="bg-background"
                onChange={(e) => update(index, { text: e.target.value })}
              />
              {textError ? <FieldError>{textError}</FieldError> : null}
            </li>
          );
        })}
      </ol>
      {issues.get("answers") ? <FieldError>{issues.get("answers")}</FieldError> : null}
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        disabled={answers.length >= MAX_INTERVIEW_ANSWERS}
        title={
          answers.length >= MAX_INTERVIEW_ANSWERS
            ? `답은 ${MAX_INTERVIEW_ANSWERS}개까지 둘 수 있습니다.`
            : undefined
        }
        onClick={add}
      >
        <Plus aria-hidden="true" />답 추가
      </Button>
    </fieldset>
  );
}
