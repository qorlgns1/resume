"use client";

import type { ContentLibrary, ModuleInstance, Page } from "@resume/contracts";
import { BentoGrid, type RenderOptions } from "@resume/modules";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@resume/ui/components/empty";
import { cn } from "@resume/ui/lib/utils";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import type { PreviewViewport } from "./editor";

const FRAME_WIDTH: Record<PreviewViewport, number> = { desktop: 1440, mobile: 390 };
const previewOptions: RenderOptions = { inert: true };

interface PreviewCanvasProps {
  page: Page;
  content: ContentLibrary;
  viewport: PreviewViewport;
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
}

/**
 * 공개 사이트와 같은 BentoGrid로 페이지를 그린다.
 * 그리드는 container query를 쓰므로 프레임 폭(1440/390)만 바꾸면 해당 화면의 배치가 재현된다.
 * 데스크톱 프레임은 가운데 영역에 맞게 축소해서 보여준다.
 */
export function PreviewCanvas({
  page,
  content,
  viewport,
  selectedModuleId,
  onSelectModule,
}: PreviewCanvasProps) {
  const width = FRAME_WIDTH[viewport];
  const { outerRef, innerRef, scale, height } = useFitScale(width);

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
          {page.modules.length === 0 ? (
            <Empty className="rounded-xl bg-card">
              <EmptyHeader>
                <EmptyTitle>이 페이지에는 아직 모듈이 없습니다</EmptyTitle>
                <EmptyDescription>
                  {page.title} 페이지의 구성은 다음 단계에서 정합니다. 모듈 추가 기능도 준비
                  중입니다.
                </EmptyDescription>
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
