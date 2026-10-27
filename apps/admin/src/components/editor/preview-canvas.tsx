"use client";

import {
  ADMIN_MEDIA_BASE,
  type ModuleInstance,
  type NavItem,
  publicPaths,
  type SiteSettings,
} from "@resume/contracts";
import {
  BentoGrid,
  BrandMark,
  type ContentTarget,
  type RenderOptions,
  SystemPageView,
} from "@resume/modules";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@resume/ui/components/empty";
import { cn } from "@resume/ui/lib/utils";
import { Menu, Plus } from "lucide-react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChapterSortProvider, SortableChapter } from "./chapter-sortable";
import { newHistoryChapter } from "./content-settings";
import type { PreviewViewport } from "./editor";
import { useCurrentPage, useEditor } from "./editor-context";

const FRAME_WIDTH: Record<PreviewViewport, number> = { desktop: 1440, mobile: 390 };
const previewOptions: RenderOptions = { inert: true, mediaBase: ADMIN_MEDIA_BASE };

/**
 * 공개 사이트와 같은 BentoGrid로 작업본을 그린다. 입력하는 즉시 반영된다.
 * 그리드는 container query를 쓰므로 프레임 폭(1440/390)만 바꾸면 해당 화면의 배치가 재현된다.
 * 데스크톱 프레임은 가운데 영역에 맞게 축소해서 보여준다.
 */
export function PreviewCanvas({ viewport }: { viewport: PreviewViewport }) {
  const { document, selection, select, edit } = useEditor();
  const { page } = useCurrentPage();
  const content = document.content;
  const selectedModuleId = selection?.kind === "module" ? selection.moduleId : null;
  const selectedItemId = selection?.kind === "content" ? selection.itemId : null;
  const onSelectModule = (moduleId: string) => select({ kind: "module", moduleId });
  const width = FRAME_WIDTH[viewport];
  const { outerRef, innerRef, scale, height } = useFitScale(width);

  // 목록에서 고르거나 새로 추가한 모듈이 보이도록 미리보기를 옮긴다.
  useEffect(() => {
    if (!selectedModuleId) return;
    innerRef.current
      ?.querySelector(`[data-module-id="${CSS.escape(selectedModuleId)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedModuleId, innerRef]);

  function wrapModule(module: ModuleInstance, node: ReactNode) {
    return (
      <div className="relative h-full">
        {node}
        <SelectOverlay
          label={`${module.label} 모듈 선택`}
          selected={module.id === selectedModuleId}
          onSelect={() => onSelectModule(module.id)}
          className="-inset-1 rounded-[calc(var(--rs-radius-xl)+4px)]"
        />
      </div>
    );
  }

  /** 기본 페이지 목록의 프로젝트·회사·히스토리를 누르면 그 원본 콘텐츠 편집으로 간다. */
  function wrapContent(target: ContentTarget, node: ReactNode) {
    // 카드(프로젝트·회사)는 카드 모서리를, 히스토리 글은 글 주변에 여백을 두고 테두리를 그린다.
    const card = target.section !== "history";
    return (
      <div className={cn("relative", card && "h-full")}>
        {node}
        <SelectOverlay
          label={`${target.label} 편집`}
          selected={target.itemId === selectedItemId}
          onSelect={() =>
            select({ kind: "content", section: target.section, itemId: target.itemId })
          }
          className={
            card
              ? "-inset-1 rounded-[calc(var(--rs-radius-xl)+4px)]"
              : "-inset-x-3 -inset-y-2 rounded-lg"
          }
        />
      </div>
    );
  }

  return (
    <section
      aria-label="미리보기"
      ref={outerRef}
      className="min-h-0 overflow-auto bg-secondary p-6"
    >
      <p className="mb-3 text-caption text-muted-foreground">
        {viewport === "desktop" ? "데스크톱 1440px" : "모바일 390px"} 미리보기
        {scale < 1 ? ` · ${Math.round(scale * 100)}% 축소` : ""} · 링크는 미리보기에서 이동하지
        않습니다.
      </p>
      <div style={{ width: width * scale, height: height * scale }} className="mx-auto">
        <div
          ref={innerRef}
          data-viewport={viewport}
          style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}
          className="rounded-lg bg-canvas px-4 py-6 shadow-card data-[viewport=desktop]:px-10"
        >
          <PreviewHeader
            name={content.profile.name}
            role={content.profile.role}
            logo={document.site.logo}
            navigation={viewport === "desktop" ? document.site.navigation : null}
            activeHref={page.kind === "system" ? publicPaths[page.systemKey] : null}
            onSelect={() => select({ kind: "content", section: "profile" })}
          />
          {page.kind === "system" && page.systemKey !== "home" ? (
            <ChapterSortProvider
              chapters={content.history.chapters}
              scale={scale}
              onMove={(from, to) => {
                edit((d) => {
                  const list = d.content.history.chapters;
                  const [moved] = list.splice(from, 1);
                  if (moved) list.splice(to, 0, moved);
                });
              }}
            >
              <SystemPageView
                page={page}
                content={content}
                options={previewOptions}
                wrapModule={wrapModule}
                wrapContent={wrapContent}
                wrapChapter={(target, node) => (
                  <SortableChapter id={target.itemId} label={target.label}>
                    {node}
                  </SortableChapter>
                )}
                listFooter={
                  page.systemKey === "history" ? (
                    <AddButton
                      onClick={() => {
                        const chapter = newHistoryChapter();
                        edit((d) => {
                          d.content.history.chapters.push(chapter);
                        });
                        select({ kind: "content", section: "history", itemId: chapter.id });
                      }}
                    >
                      챕터 추가
                    </AddButton>
                  ) : null
                }
              />
            </ChapterSortProvider>
          ) : page.modules.length === 0 ? (
            <Empty className="rounded-xl bg-card">
              <EmptyHeader>
                <EmptyTitle>이 페이지에는 아직 모듈이 없습니다</EmptyTitle>
                <EmptyDescription>왼쪽 "모듈 추가"에서 모듈을 넣으세요.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <BentoGrid
              page={page}
              content={content}
              options={previewOptions}
              wrapModule={wrapModule}
            />
          )}
        </div>
      </div>
    </section>
  );
}

/** 미리보기 목록 끝에 놓는 추가 버튼. 공개 사이트에는 없다. */
function AddButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong py-6 text-body font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary-text focus-visible:border-primary focus-visible:outline-none"
    >
      <Plus aria-hidden="true" className="size-5" />
      {children}
    </button>
  );
}

/** 미리보기 위에 덧씌우는 선택 영역. 누르면 오른쪽 설정 패널이 바뀐다. */
function SelectOverlay({
  label,
  selected,
  onSelect,
  className,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        "absolute border-[3px] border-transparent transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none",
        className,
        selected && "border-primary hover:border-primary",
      )}
    />
  );
}

/**
 * 공개 사이트 머리글(SiteHeader)과 같은 모양. 누르면 프로필 편집으로 간다.
 * 공개 사이트는 화면 폭으로 메뉴 형태를 고르지만, 미리보기는 고른 화면(navigation 유무)으로 고른다.
 */
function PreviewHeader({
  name,
  role,
  logo,
  navigation,
  activeHref,
  onSelect,
}: {
  name: string;
  role: string;
  logo: SiteSettings["logo"];
  navigation: NavItem[] | null;
  activeHref: string | null;
  onSelect: () => void;
}) {
  return (
    // 선택 테두리가 글자와 아래 카드에 붙지 않도록, 안쪽 여백을 두고 같은 만큼 바깥으로 넓힌다.
    <header className="relative -mx-3 mb-2.5 flex items-center justify-between gap-4 px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark name={name} logo={logo} options={previewOptions} />
        <span className="flex min-w-0 items-baseline gap-3">
          <span className="text-title font-extrabold tracking-tight">{name}</span>
          <span className="truncate text-body-sm text-muted-foreground">{role}</span>
        </span>
      </div>
      {navigation ? (
        <ul className="flex items-center gap-1">
          {navigation.map((item) => (
            <li
              key={item.id}
              className={cn(
                "relative flex h-10 items-center px-3 text-body-sm font-semibold text-muted-foreground",
                item.href === activeHref &&
                  "text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary",
              )}
            >
              {item.label}
            </li>
          ))}
        </ul>
      ) : (
        <span className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card">
          <Menu aria-hidden="true" className="size-5" />
        </span>
      )}
      <button
        type="button"
        aria-label="머리글: 프로필 편집으로 이동"
        onClick={onSelect}
        className="absolute inset-0 rounded-lg border-[3px] border-transparent transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none"
      />
    </header>
  );
}

function useFitScale(frameWidth: number) {
  const outerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const style = getComputedStyle(outer);
      const available =
        outer.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      setScale(Math.min(1, available / frameWidth));
      setHeight(inner.offsetHeight);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [frameWidth]);

  return { outerRef, innerRef, scale, height };
}
