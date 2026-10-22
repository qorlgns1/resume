import {
  type ContentLibrary,
  type DesktopPlacement,
  type ModuleInstance,
  type Page,
  resolveMobileLayout,
} from "@resume/contracts";
import type { CSSProperties, ReactNode } from "react";
import { ModuleFrame } from "./module-frame";
import { ModuleContent } from "./module-renderer";
import type { RenderOptions } from "./types";

interface BentoGridProps {
  page: Page;
  content: ContentLibrary;
  options?: RenderOptions;
  /**
   * 렌더링된 모듈을 감싸는 함수. 어드민 미리보기에서 선택 영역을 덧씌울 때 사용한다.
   */
  wrapModule?: (module: ModuleInstance, node: ReactNode) => ReactNode;
}

/**
 * 페이지의 모듈을 12칼럼(데스크톱) / 2칼럼(모바일) 벤토 그리드로 배치한다.
 * DOM 순서는 데스크톱 읽기 순서(row → col)를 따른다.
 */
export function BentoGrid({ page, content, options = {}, wrapModule }: BentoGridProps) {
  const modules = new Map(page.modules.map((m) => [m.id, m]));
  const mobile = new Map(resolveMobileLayout(page.layout).map((item) => [item.moduleId, item]));
  const placements = [...page.layout.desktop.items].sort((a, b) => a.row - b.row || a.col - b.col);

  return (
    <div className="rs-bento">
      <div className="rs-bento__grid">
        {placements.map((placement) => {
          const module = modules.get(placement.moduleId);
          if (!module) return null;
          const mobileItem = mobile.get(module.id);
          const frame = (
            <ModuleFrame module={module} mobileStyle={mobileItem?.style}>
              <ModuleContent module={module} content={content} options={options} />
            </ModuleFrame>
          );
          return (
            <div
              key={module.id}
              className="rs-bento__item"
              style={placementVars(placement, mobileItem)}
            >
              {wrapModule ? wrapModule(module, frame) : frame}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function placementVars(
  desktop: DesktopPlacement,
  mobile: { order: number; span: 1 | 2 } | undefined,
): CSSProperties {
  return {
    "--d-col": desktop.col,
    "--d-span": desktop.colSpan,
    "--d-row": desktop.row,
    "--d-rspan": desktop.rowSpan,
    "--m-order": mobile?.order ?? 0,
    "--m-span": mobile?.span ?? 2,
    "--m-display": mobile ? "block" : "none",
  } as CSSProperties;
}
