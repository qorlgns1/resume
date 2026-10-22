import { z } from "zod";
import { IdSchema } from "./primitives";
import { ModuleStyleOverrideSchema } from "./style";

/*
 * 화면별 배치. 콘텐츠(모듈 인스턴스)는 공유하고 배치만 화면별로 분리한다.
 *
 * 데스크톱: 12칼럼 그리드 위의 명시적 좌표(col/row)와 크기(colSpan/rowSpan).
 *   행 높이는 내용에 맞춰 자동으로 정해진다. 추후 드래그 이동·크기 변경은 이 값을 바꾸는 것으로 구현한다.
 * 모바일: 2칼럼 그리드.
 *   - strategy "auto": 데스크톱 순서(row → col)를 따라 한 줄에 하나씩 자동 배치
 *   - strategy "custom": items의 order/span을 사용
 *   어느 쪽이든 items의 hidden과 style 덮어쓰기는 적용한다.
 */

export const DESKTOP_COLUMNS = 12;
export const MOBILE_COLUMNS = 2;

export const DesktopPlacementSchema = z
  .object({
    moduleId: IdSchema,
    col: z.number().int().min(1).max(DESKTOP_COLUMNS),
    colSpan: z.number().int().min(1).max(DESKTOP_COLUMNS),
    row: z.number().int().min(1),
    rowSpan: z.number().int().min(1).max(6),
  })
  .refine((p) => p.col + p.colSpan - 1 <= DESKTOP_COLUMNS, {
    message: `col + colSpan이 ${DESKTOP_COLUMNS}칼럼을 넘을 수 없습니다.`,
    path: ["colSpan"],
  });
export type DesktopPlacement = z.infer<typeof DesktopPlacementSchema>;

export const MobilePlacementSchema = z.object({
  moduleId: IdSchema,
  order: z.number().int().min(0).optional(),
  span: z.union([z.literal(1), z.literal(2)]).optional(),
  hidden: z.boolean().optional(),
  style: ModuleStyleOverrideSchema.optional(),
});
export type MobilePlacement = z.infer<typeof MobilePlacementSchema>;

export const PageLayoutSchema = z.object({
  desktop: z.object({
    columns: z.literal(DESKTOP_COLUMNS),
    items: z.array(DesktopPlacementSchema),
  }),
  mobile: z.object({
    columns: z.literal(MOBILE_COLUMNS),
    strategy: z.enum(["auto", "custom"]),
    items: z.array(MobilePlacementSchema),
  }),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;

/** 데스크톱 배치에서 서로 겹치는 모듈 쌍을 찾는다. */
export function findDesktopOverlaps(items: readonly DesktopPlacement[]): [string, string][] {
  const overlaps: [string, string][] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (!a || !b) continue;
      const colsOverlap = a.col < b.col + b.colSpan && b.col < a.col + a.colSpan;
      const rowsOverlap = a.row < b.row + b.rowSpan && b.row < a.row + a.rowSpan;
      if (colsOverlap && rowsOverlap) overlaps.push([a.moduleId, b.moduleId]);
    }
  }
  return overlaps;
}

export interface ResolvedMobileItem {
  moduleId: string;
  order: number;
  span: 1 | 2;
  style?: MobilePlacement["style"];
}

/** 모바일 배치 계산. 숨김 모듈은 결과에서 제외한다. */
export function resolveMobileLayout(layout: PageLayout): ResolvedMobileItem[] {
  const overrides = new Map(layout.mobile.items.map((item) => [item.moduleId, item]));
  const desktopOrder = [...layout.desktop.items].sort((a, b) => a.row - b.row || a.col - b.col);

  return desktopOrder
    .map((placement, index): ResolvedMobileItem | null => {
      const override = overrides.get(placement.moduleId);
      if (override?.hidden) return null;
      const custom = layout.mobile.strategy === "custom";
      return {
        moduleId: placement.moduleId,
        order: custom ? (override?.order ?? index) : index,
        span: custom ? (override?.span ?? MOBILE_COLUMNS) : MOBILE_COLUMNS,
        style: override?.style,
      };
    })
    .filter((item): item is ResolvedMobileItem => item !== null)
    .sort((a, b) => a.order - b.order);
}
