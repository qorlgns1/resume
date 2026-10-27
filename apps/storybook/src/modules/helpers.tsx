import type { ContentLibrary, DesktopPlacement, ModuleInstance, Page } from "@resume/contracts";
import { sampleContent, sampleHomePage } from "@resume/contracts/samples";
import { BentoGrid } from "@resume/modules";

export function sampleModule(id: string): ModuleInstance {
  const module = sampleHomePage.modules.find((m) => m.id === id);
  if (!module) throw new Error(`샘플 모듈 없음: ${id}`);
  return module;
}

/** 모듈 하나를 실제와 같은 벤토 그리드 안에서 렌더링한다. */
export function SingleModule({
  module,
  colSpan = 12,
  content = sampleContent,
}: {
  module: ModuleInstance;
  colSpan?: number;
  /** 샘플 콘텐츠를 바꿔 보고 싶을 때 */
  content?: ContentLibrary;
}) {
  const placement: DesktopPlacement = { moduleId: module.id, col: 1, colSpan, row: 1, rowSpan: 1 };
  const page: Page = {
    id: "page_story",
    kind: "custom",
    slug: "story",
    title: "Story",
    modules: [module],
    layout: {
      desktop: { columns: 12, items: [placement] },
      mobile: { columns: 2, strategy: "auto", items: [] },
    },
  };
  return <BentoGrid page={page} content={content} />;
}
