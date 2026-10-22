"use client";

import {
  DESKTOP_COLUMNS,
  type MobilePlacement,
  type ModuleInstance,
  type ModuleStyle,
  resolveMobileLayout,
} from "@resume/contracts";
import { getModuleCatalogEntry } from "@resume/modules";
import { Badge } from "@resume/ui/components/badge";
import { Button } from "@resume/ui/components/button";
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
import { FieldError, FieldGroup } from "@resume/ui/components/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@resume/ui/components/tabs";
import { Trash2 } from "lucide-react";
import { useCurrentPage, useEditor } from "./editor-context";
import { Group, NumberField, SelectField, SwitchField, TextField } from "./fields";
import { ModuleContentForm } from "./module-content-form";

const styleOptions: {
  key: keyof ModuleStyle;
  label: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "background",
    label: "배경",
    options: [
      { value: "surface", label: "흰 카드" },
      { value: "muted", label: "옅은 회색" },
      { value: "inverse", label: "어두운 카드" },
      { value: "primary-soft", label: "옅은 강조색" },
      { value: "transparent", label: "카드 없음" },
    ],
  },
  {
    key: "textScale",
    label: "글자 크기",
    options: [
      { value: "sm", label: "작게" },
      { value: "md", label: "기본" },
      { value: "lg", label: "크게" },
    ],
  },
  {
    key: "align",
    label: "정렬",
    options: [
      { value: "start", label: "왼쪽" },
      { value: "center", label: "가운데" },
    ],
  },
  {
    key: "padding",
    label: "여백",
    options: [
      { value: "none", label: "없음" },
      { value: "sm", label: "좁게" },
      { value: "md", label: "기본" },
      { value: "lg", label: "넓게" },
    ],
  },
  {
    key: "border",
    label: "테두리",
    options: [
      { value: "none", label: "없음" },
      { value: "subtle", label: "옅게" },
      { value: "strong", label: "진하게" },
    ],
  },
];

const SAME_AS_DESKTOP = "__desktop";

export function ModuleSettings({ module }: { module: ModuleInstance }) {
  const { edit, issues, select } = useEditor();
  const { page, pageIndex } = useCurrentPage();
  const moduleIndex = page.modules.findIndex((m) => m.id === module.id);
  const modulePath = ["pages", pageIndex, "modules", moduleIndex] as const;
  const desktopIndex = page.layout.desktop.items.findIndex((i) => i.moduleId === module.id);
  const desktop = page.layout.desktop.items[desktopIndex];
  const mobileIndex = page.layout.mobile.items.findIndex((i) => i.moduleId === module.id);
  const mobile = page.layout.mobile.items[mobileIndex];
  const resolvedMobile = resolveMobileLayout(page.layout).find((i) => i.moduleId === module.id);

  const updateModule = (mutate: (m: ModuleInstance) => void) =>
    edit((doc) => {
      const target = doc.pages[pageIndex]?.modules[moduleIndex];
      if (target) mutate(target);
    });

  const updateDesktop = (mutate: (d: NonNullable<typeof desktop>) => void) =>
    edit((doc) => {
      const target = doc.pages[pageIndex]?.layout.desktop.items[desktopIndex];
      if (target) mutate(target);
    });

  /** 모바일 설정을 고친다. 항목이 없으면 만들고, 비어 있으면 지운다. */
  const updateMobile = (mutate: (item: MobilePlacement) => void) =>
    edit((doc) => {
      const items = doc.pages[pageIndex]?.layout.mobile.items;
      if (!items) return;
      let item = items.find((i) => i.moduleId === module.id);
      if (!item) {
        item = { moduleId: module.id };
        items.push(item);
      }
      mutate(item);
      if (item.style && Object.keys(item.style).length === 0) delete item.style;
      const empty =
        item.order === undefined && item.span === undefined && !item.hidden && !item.style;
      if (empty) items.splice(items.indexOf(item), 1);
    });

  const removeModule = () => {
    edit((doc) => {
      const target = doc.pages[pageIndex];
      if (!target) return;
      target.modules = target.modules.filter((m) => m.id !== module.id);
      target.layout.desktop.items = target.layout.desktop.items.filter(
        (i) => i.moduleId !== module.id,
      );
      target.layout.mobile.items = target.layout.mobile.items.filter(
        (i) => i.moduleId !== module.id,
      );
    });
    select(null);
  };

  const layoutIssues = issues
    .under(["pages", pageIndex, "layout"])
    .filter((i) => i.path.length <= 4);

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-title font-bold tracking-tight">{module.label}</h2>
            <Badge variant="secondary" className="rounded-sm">
              {getModuleCatalogEntry(module.type).label}
            </Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="모듈 삭제">
                <Trash2 aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>"{module.label}" 모듈을 삭제할까요?</DialogTitle>
                <DialogDescription>
                  초안에서만 삭제됩니다. 저장하고 게시하기 전까지 공개 사이트에는 반영되지 않습니다.
                  연결된 원본 콘텐츠는 지워지지 않습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">취소</Button>
                </DialogClose>
                <Button variant="destructive" onClick={removeModule}>
                  삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-caption text-subtle-foreground">
          모듈 ID <code className="rounded-xs bg-muted px-1 py-0.5 font-mono">{module.id}</code>
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
            <TextField
              label="모듈 이름"
              description="어드민에서만 보이는 이름입니다."
              path={[...modulePath, "label"]}
              value={module.label}
              onChange={(v) =>
                updateModule((m) => {
                  m.label = v;
                })
              }
            />
            <ModuleContentForm module={module} path={modulePath} update={updateModule} />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="style" className="flex flex-col gap-5 pt-3">
          <FieldGroup className="gap-4">
            {styleOptions.map((option) => (
              <SelectField
                key={option.key}
                label={option.label}
                path={[...modulePath, "style", option.key]}
                value={module.style[option.key]}
                options={option.options}
                onChange={(v) =>
                  updateModule((m) => {
                    (m.style as Record<string, string>)[option.key] = v;
                  })
                }
              />
            ))}
          </FieldGroup>
          <Group title="모바일에서만 다르게">
            {styleOptions.map((option) => (
              <SelectField
                key={option.key}
                label={option.label}
                path={[
                  "pages",
                  pageIndex,
                  "layout",
                  "mobile",
                  "items",
                  mobileIndex,
                  "style",
                  option.key,
                ]}
                value={(mobile?.style?.[option.key] as string | undefined) ?? SAME_AS_DESKTOP}
                options={[{ value: SAME_AS_DESKTOP, label: "데스크톱과 같음" }, ...option.options]}
                onChange={(v) =>
                  updateMobile((item) => {
                    const style = { ...item.style } as Record<string, string>;
                    if (v === SAME_AS_DESKTOP) delete style[option.key];
                    else style[option.key] = v;
                    item.style = style;
                  })
                }
              />
            ))}
          </Group>
        </TabsContent>

        <TabsContent value="layout" className="flex flex-col gap-5 pt-3">
          {layoutIssues.length > 0 ? (
            <FieldError className="rounded-md bg-destructive-soft px-3 py-2 text-caption">
              {layoutIssues.map((i) => i.message).join(" ")}
            </FieldError>
          ) : null}
          {desktop ? (
            <Group title={`데스크톱 · ${DESKTOP_COLUMNS}칼럼`}>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["col", "시작 칼럼", 1, DESKTOP_COLUMNS],
                    ["colSpan", "너비 (칼럼)", 1, DESKTOP_COLUMNS],
                    ["row", "행", 1, 99],
                    ["rowSpan", "높이 (행)", 1, 6],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <NumberField
                    key={key}
                    label={label}
                    min={min}
                    max={max}
                    path={["pages", pageIndex, "layout", "desktop", "items", desktopIndex, key]}
                    value={desktop[key]}
                    onChange={(v) =>
                      updateDesktop((d) => {
                        d[key] = v;
                      })
                    }
                  />
                ))}
              </div>
              <fieldset className="flex flex-wrap items-center gap-1.5">
                <legend className="sr-only">너비 빠르게 정하기</legend>
                <span className="text-caption text-muted-foreground" aria-hidden="true">
                  너비
                </span>
                {[3, 4, 5, 6, 7, 8, 12].map((span) => (
                  <Button
                    key={span}
                    variant={desktop.colSpan === span ? "secondary" : "outline"}
                    size="xs"
                    aria-pressed={desktop.colSpan === span}
                    onClick={() =>
                      updateDesktop((d) => {
                        d.colSpan = span;
                        if (d.col + span - 1 > DESKTOP_COLUMNS) d.col = DESKTOP_COLUMNS - span + 1;
                      })
                    }
                  >
                    {span}
                  </Button>
                ))}
              </fieldset>
              <p className="text-caption text-muted-foreground">
                같은 행에 놓인 모듈끼리 칼럼이 겹치면 저장할 수 없습니다. 드래그 편집은 다음
                단계에서 추가합니다.
              </p>
            </Group>
          ) : null}

          <Group title="모바일 · 2칼럼">
            <SelectField
              label="배치 방식 (페이지 전체)"
              path={["pages", pageIndex, "layout", "mobile", "strategy"]}
              value={page.layout.mobile.strategy}
              options={[
                { value: "auto", label: "자동: 데스크톱 순서대로 한 줄씩" },
                { value: "custom", label: "직접: 순서와 너비를 모듈마다 지정" },
              ]}
              onChange={(v) =>
                edit((doc) => {
                  const p = doc.pages[pageIndex];
                  if (p) p.layout.mobile.strategy = v;
                })
              }
            />
            <SwitchField
              label="모바일에서 숨기기"
              checked={mobile?.hidden ?? false}
              onChange={(checked) =>
                updateMobile((item) => {
                  if (checked) item.hidden = true;
                  else delete item.hidden;
                })
              }
            />
            {page.layout.mobile.strategy === "custom" && !mobile?.hidden ? (
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="순서"
                  min={0}
                  path={["pages", pageIndex, "layout", "mobile", "items", mobileIndex, "order"]}
                  value={mobile?.order ?? resolvedMobile?.order ?? 0}
                  onChange={(v) =>
                    updateMobile((item) => {
                      item.order = v;
                    })
                  }
                />
                <SelectField
                  label="너비"
                  path={["pages", pageIndex, "layout", "mobile", "items", mobileIndex, "span"]}
                  value={String(mobile?.span ?? 2) as "1" | "2"}
                  options={[
                    { value: "2", label: "전체" },
                    { value: "1", label: "절반" },
                  ]}
                  onChange={(v) =>
                    updateMobile((item) => {
                      item.span = v === "1" ? 1 : 2;
                    })
                  }
                />
              </div>
            ) : null}
            {page.layout.mobile.strategy === "custom" ? (
              <p className="text-caption text-muted-foreground">
                직접 배치는 화면 순서만 바꿉니다. 스크린 리더는 데스크톱 순서로 읽으므로 순서를 크게
                바꾸지 않는 것이 좋습니다.
              </p>
            ) : null}
          </Group>
        </TabsContent>
      </Tabs>
    </div>
  );
}
