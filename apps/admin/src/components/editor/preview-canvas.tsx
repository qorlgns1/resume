"use client";

import {
  ADMIN_MEDIA_BASE,
  type ModuleInstance,
  type NavItem,
  publicPaths,
} from "@resume/contracts";
import { BentoGrid, type RenderOptions, SystemPageView } from "@resume/modules";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@resume/ui/components/empty";
import { cn } from "@resume/ui/lib/utils";
import { Menu } from "lucide-react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const { document, selection, select } = useEditor();
  const { page } = useCurrentPage();
  const content = document.content;
  const selectedModuleId = selection?.kind === "module" ? selection.moduleId : null;
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
    const selected = module.id === selectedModuleId;
    return (
      <div className="relative h-full">
        {node}
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${module.label} 모듈 선택`}
          onClick={() => onSelectModule(module.id)}
          className={cn(
            "absolute -inset-1 rounded-[calc(var(--rs-radius-xl)+4px)] border-[3px] border-transparent transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none",
            selected && "border-primary hover:border-primary",
          )}
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
            navigation={viewport === "desktop" ? document.site.navigation : null}
            activeHref={page.kind === "system" ? publicPaths[page.systemKey] : null}
            onSelect={() => select({ kind: "content", section: "profile" })}
          />
          {page.kind === "system" && page.systemKey !== "home" ? (
            <SystemPageView
              page={page}
              content={content}
              options={previewOptions}
              wrapModule={wrapModule}
            />
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

/**
 * 공개 사이트 머리글(SiteHeader)과 같은 모양. 누르면 프로필 편집으로 간다.
 * 공개 사이트는 화면 폭으로 메뉴 형태를 고르지만, 미리보기는 고른 화면(navigation 유무)으로 고른다.
 */
function PreviewHeader({
  name,
  role,
  navigation,
  activeHref,
  onSelect,
}: {
  name: string;
  role: string;
  navigation: NavItem[] | null;
  activeHref: string | null;
  onSelect: () => void;
}) {
  return (
    // 선택 테두리가 글자와 아래 카드에 붙지 않도록, 안쪽 여백을 두고 같은 만큼 바깥으로 넓힌다.
    <header className="relative -mx-3 mb-2.5 flex items-center justify-between gap-4 px-3 py-1.5">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="text-title font-extrabold tracking-tight">{name}</span>
        <span className="truncate text-body-sm text-muted-foreground">{role}</span>
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
