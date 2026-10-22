"use client";

import {
  type ContentLibrary,
  type ModuleInstance,
  type ModuleStyle,
  type Page,
  resolveMobileLayout,
} from "@resume/contracts";
import { getModuleCatalogEntry } from "@resume/modules";
import { Badge } from "@resume/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@resume/ui/components/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@resume/ui/components/field";
import { Input } from "@resume/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resume/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@resume/ui/components/tabs";
import { Textarea } from "@resume/ui/components/textarea";
import { MousePointerClick } from "lucide-react";
import { useId } from "react";
import { describeModuleContent } from "./describe-module";

interface SettingsPanelProps {
  page: Page;
  module: ModuleInstance | null;
  content: ContentLibrary;
}

const styleOptions: { key: keyof ModuleStyle; label: string; options: Record<string, string> }[] = [
  {
    key: "background",
    label: "배경",
    options: {
      surface: "흰 카드",
      muted: "옅은 회색",
      inverse: "어두운 카드",
      "primary-soft": "옅은 강조색",
      transparent: "카드 없음",
    },
  },
  { key: "textScale", label: "글자 크기", options: { sm: "작게", md: "기본", lg: "크게" } },
  { key: "align", label: "정렬", options: { start: "왼쪽", center: "가운데" } },
  { key: "padding", label: "여백", options: { none: "없음", sm: "좁게", md: "기본", lg: "넓게" } },
  { key: "border", label: "테두리", options: { none: "없음", subtle: "옅게", strong: "진하게" } },
];

export function SettingsPanel({ page, module, content }: SettingsPanelProps) {
  return (
    <aside
      aria-label="모듈 설정"
      className="min-h-0 overflow-y-auto border-l border-border bg-card"
    >
      {module ? (
        <ModuleSettings key={module.id} page={page} module={module} content={content} />
      ) : (
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MousePointerClick aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>모듈을 선택하세요</EmptyTitle>
            <EmptyDescription>
              미리보기나 왼쪽 목록에서 모듈을 선택하면 설정이 여기에 표시됩니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </aside>
  );
}

function ModuleSettings({
  page,
  module,
  content,
}: {
  page: Page;
  module: ModuleInstance;
  content: ContentLibrary;
}) {
  const desktop = page.layout.desktop.items.find((item) => item.moduleId === module.id);
  const mobileOverride = page.layout.mobile.items.find((item) => item.moduleId === module.id);
  const mobileResolved = resolveMobileLayout(page.layout).find(
    (item) => item.moduleId === module.id,
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-title font-bold tracking-tight">{module.label}</h2>
          <Badge variant="secondary" className="rounded-sm">
            {getModuleCatalogEntry(module.type).label}
          </Badge>
        </div>
        <p className="text-caption text-subtle-foreground">
          모듈 ID <code className="rounded-xs bg-muted px-1 py-0.5 font-mono">{module.id}</code>
        </p>
        <p role="note" className="rounded-md bg-warning-soft px-3 py-2 text-caption text-warning">
          편집은 준비 중입니다. 현재 값을 읽기 전용으로 보여줍니다.
        </p>
      </header>

      <Tabs defaultValue="content">
        <TabsList className="w-full">
          <TabsTrigger value="content">콘텐츠</TabsTrigger>
          <TabsTrigger value="style">스타일</TabsTrigger>
          <TabsTrigger value="layout">배치</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="pt-3">
          <FieldGroup className="gap-4">
            {describeModuleContent(module, content).map((field) => (
              <ReadOnlyField key={field.label} {...field} />
            ))}
          </FieldGroup>
        </TabsContent>

        <TabsContent value="style" className="pt-3">
          <FieldGroup className="gap-4">
            {styleOptions.map((option) => (
              <StyleField
                key={option.key}
                label={option.label}
                options={option.options}
                value={module.style[option.key]}
                mobileValue={mobileOverride?.style?.[option.key]}
                mobileLabel={option.options[mobileOverride?.style?.[option.key] ?? ""]}
              />
            ))}
          </FieldGroup>
        </TabsContent>

        <TabsContent value="layout" className="flex flex-col gap-5 pt-3">
          <section className="flex flex-col gap-3">
            <h3 className="text-body-sm font-semibold">데스크톱 · 12칼럼</h3>
            {desktop ? (
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="시작 칼럼" value={String(desktop.col)} />
                <ReadOnlyField label="너비 (칼럼)" value={String(desktop.colSpan)} />
                <ReadOnlyField label="행" value={String(desktop.row)} />
                <ReadOnlyField label="높이 (행)" value={String(desktop.rowSpan)} />
              </div>
            ) : null}
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-body-sm font-semibold">
              모바일 · {page.layout.mobile.strategy === "auto" ? "자동 배치" : "직접 배치"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField
                label="순서"
                value={mobileResolved ? String(mobileResolved.order + 1) : "숨김"}
              />
              <ReadOnlyField
                label="너비"
                value={mobileResolved ? (mobileResolved.span === 2 ? "전체" : "절반") : "숨김"}
              />
            </div>
            <p className="text-caption text-muted-foreground">
              자동 배치는 데스크톱의 읽기 순서를 따라 한 줄에 하나씩 쌓습니다. 모바일 전용 순서·너비
              조정은 다음 단계에서 편집할 수 있습니다.
            </p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  source,
  multiline,
}: {
  label: string;
  value: string;
  source?: string;
  multiline?: boolean;
}) {
  const id = useId();
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-caption font-semibold text-muted-foreground">
        {label}
      </FieldLabel>
      {multiline ? (
        <Textarea id={id} value={value} readOnly className="bg-muted text-body-sm" />
      ) : (
        <Input id={id} value={value} readOnly className="bg-muted text-body-sm" />
      )}
      {source ? (
        <FieldDescription className="text-caption">
          원본: {source} (모든 페이지에 공통)
        </FieldDescription>
      ) : null}
    </Field>
  );
}

function StyleField({
  label,
  options,
  value,
  mobileValue,
  mobileLabel,
}: {
  label: string;
  options: Record<string, string>;
  value: string;
  mobileValue: string | undefined;
  mobileLabel: string | undefined;
}) {
  const id = useId();
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-caption font-semibold text-muted-foreground">
        {label}
      </FieldLabel>
      <Select value={value} disabled>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mobileValue ? (
        <FieldDescription className="text-caption">모바일: {mobileLabel}</FieldDescription>
      ) : null}
    </Field>
  );
}
