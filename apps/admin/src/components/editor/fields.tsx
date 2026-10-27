"use client";

import { Checkbox } from "@resume/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@resume/ui/components/field";
import { Input } from "@resume/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resume/ui/components/select";
import { Switch } from "@resume/ui/components/switch";
import { Textarea } from "@resume/ui/components/textarea";
import { cn } from "@resume/ui/lib/utils";
import { type ReactNode, useEffect, useId, useState } from "react";
import { useEditor } from "./editor-context";
import type { Path } from "./issues";

/*
 * 편집 폼 필드. 모두 제어 컴포넌트이며 path로 해당 위치의 검증 오류를 찾아 함께 보여준다.
 */

interface BaseProps {
  label: string;
  path: Path;
  description?: ReactNode;
  className?: string;
}

function useFieldError(path: Path) {
  return useEditor().issues.at(path);
}

function FieldShell({
  id,
  label,
  description,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  description?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Field data-invalid={error ? "true" : undefined} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={id} className="text-caption font-semibold">
        {label}
      </FieldLabel>
      {children}
      {description ? (
        <FieldDescription className="text-caption">{description}</FieldDescription>
      ) : null}
      {error ? (
        <FieldError id={`${id}-error`} className="text-caption">
          {error}
        </FieldError>
      ) : null}
    </Field>
  );
}

export function TextField({
  label,
  path,
  description,
  className,
  value,
  onChange,
  multiline = false,
  placeholder,
  type = "text",
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  type?: "text" | "url" | "month";
}) {
  const id = useId();
  const error = useFieldError(path);
  const common = {
    id,
    value,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    className: "bg-background text-body-sm",
  } as const;
  return (
    <FieldShell id={id} label={label} description={description} error={error} className={className}>
      {multiline ? (
        <Textarea {...common} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input {...common} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
    </FieldShell>
  );
}

export function NumberField({
  label,
  path,
  description,
  className,
  value,
  onChange,
  min,
  max,
}: BaseProps & { value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const id = useId();
  const error = useFieldError(path);
  return (
    <FieldShell id={id} label={label} description={description} error={error} className={className}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="bg-background text-body-sm"
        onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  path,
  description,
  className,
  value,
  onChange,
  options,
}: BaseProps & {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  const id = useId();
  const error = useFieldError(path);
  return (
    <FieldShell id={id} label={label} description={description} error={error} className={className}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger
          id={id}
          className="w-full bg-background"
          aria-invalid={error ? true : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export function SwitchField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <Field orientation="horizontal" className="items-start justify-between gap-3">
      <span className="flex flex-col gap-0.5">
        <FieldLabel htmlFor={id} className="text-body-sm font-semibold">
          {label}
        </FieldLabel>
        {description ? (
          <FieldDescription className="text-caption">{description}</FieldDescription>
        ) : null}
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Field>
  );
}

function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** 쉼표로 구분한 목록. 입력 중인 쉼표를 지우지 않도록 원문을 따로 들고 있다. */
export function CommaListField({
  label,
  path,
  description,
  className,
  value,
  onChange,
  placeholder,
}: BaseProps & {
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join(", "));
  useEffect(() => {
    // 복원·다시 불러오기 등 바깥에서 값이 바뀌면 원문을 맞춘다.
    setText((current) =>
      parseCommaList(current).join("\u0000") === value.join("\u0000") ? current : value.join(", "),
    );
  }, [value]);
  return (
    <TextField
      label={label}
      path={path}
      className={className}
      description={description ?? "쉼표(,)로 구분합니다."}
      value={text}
      placeholder={placeholder}
      onChange={(raw) => {
        setText(raw);
        onChange(parseCommaList(raw));
      }}
    />
  );
}

/** 원본 콘텐츠 선택 (순서 있음, 최대 개수 제한) */
export function ReferencePicker({
  legend,
  path,
  description,
  options,
  value,
  onChange,
  max,
}: {
  legend: string;
  path: Path;
  description?: string;
  options: readonly { id: string; label: string; hint?: string }[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  max: number;
}) {
  const error = useEditor().issues.at(path);
  const id = useId();
  return (
    <FieldSet className="gap-2" aria-describedby={error ? `${id}-error` : undefined}>
      <FieldLegend variant="label" className="mb-0 text-caption font-semibold">
        {legend} ({value.length}/{max})
      </FieldLegend>
      {description ? (
        <FieldDescription className="text-caption">{description}</FieldDescription>
      ) : null}
      {options.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          선택할 항목이 없습니다. 콘텐츠에서 먼저 추가하세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {options.map((option) => {
            const index = value.indexOf(option.id);
            const checked = index >= 0;
            const disabled = !checked && value.length >= max;
            const checkboxId = `${id}-${option.id}`;
            return (
              <li key={option.id} className="flex items-center gap-2 rounded-md px-1 py-1">
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(next) =>
                    onChange(next ? [...value, option.id] : value.filter((v) => v !== option.id))
                  }
                />
                <label
                  htmlFor={checkboxId}
                  className={cn("flex-1 text-body-sm", disabled && "opacity-50")}
                >
                  {option.label}
                  {option.hint ? (
                    <span className="ml-1 text-caption text-muted-foreground">{option.hint}</span>
                  ) : null}
                </label>
                {checked ? (
                  <span className="text-caption text-subtle-foreground tabular-nums">
                    {index + 1}번째
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {error ? (
        <FieldError id={`${id}-error`} className="text-caption">
          {error}
        </FieldError>
      ) : null}
    </FieldSet>
  );
}

/** 하위 항목 묶음 (버튼 목록, 상태 항목 등) */
export function Group({
  title,
  action,
  children,
  className,
  itemKey,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 설정 패널에서 이 묶음을 찾아 스크롤할 때 쓰는 원본 콘텐츠 ID */
  itemKey?: string;
}) {
  return (
    <section
      data-item-id={itemKey}
      className={cn("flex flex-col gap-3 rounded-lg border border-border p-3", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-caption font-semibold text-muted-foreground">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}
