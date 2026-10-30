import { z } from "zod";
import { findDesktopOverlaps, PageLayoutSchema } from "./layout";
import { ModuleInstanceSchema } from "./modules";
import { HrefSchema, IdSchema, ImageMediaSchema, LinkSchema, SlugSchema } from "./primitives";

/** 기본 제공 페이지. 사용자가 추가한 페이지는 kind "custom"으로 구분한다. */
export const SystemPageKeySchema = z.enum(["home", "projects", "experience", "history", "about"]);
export type SystemPageKey = z.infer<typeof SystemPageKeySchema>;

const pageBase = {
  id: IdSchema,
  title: z.string().min(1).max(40),
  description: z.string().max(160).optional(),
  modules: z.array(ModuleInstanceSchema),
  layout: PageLayoutSchema,
};

export const PageSchema = z
  .discriminatedUnion("kind", [
    z.object({ ...pageBase, kind: z.literal("system"), systemKey: SystemPageKeySchema }),
    z.object({ ...pageBase, kind: z.literal("custom"), slug: SlugSchema }),
  ])
  .superRefine((page, ctx) => {
    const moduleIds = new Set<string>();
    for (const module of page.modules) {
      if (moduleIds.has(module.id)) {
        ctx.addIssue({
          code: "custom",
          message: `모듈 ID가 중복됩니다: ${module.id}`,
          path: ["modules"],
        });
      }
      moduleIds.add(module.id);
    }

    const placed = new Set<string>();
    for (const item of page.layout.desktop.items) {
      if (!moduleIds.has(item.moduleId)) {
        ctx.addIssue({
          code: "custom",
          message: `존재하지 않는 모듈을 배치했습니다: ${item.moduleId}`,
          path: ["layout", "desktop"],
        });
      }
      if (placed.has(item.moduleId)) {
        ctx.addIssue({
          code: "custom",
          message: `모듈이 두 번 배치되었습니다: ${item.moduleId}`,
          path: ["layout", "desktop"],
        });
      }
      placed.add(item.moduleId);
    }
    for (const id of moduleIds) {
      if (!placed.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: `데스크톱 배치가 없는 모듈입니다: ${id}`,
          path: ["layout", "desktop"],
        });
      }
    }
    for (const item of page.layout.mobile.items) {
      if (!moduleIds.has(item.moduleId)) {
        ctx.addIssue({
          code: "custom",
          message: `존재하지 않는 모듈의 모바일 설정입니다: ${item.moduleId}`,
          path: ["layout", "mobile"],
        });
      }
    }
    for (const [a, b] of findDesktopOverlaps(page.layout.desktop.items)) {
      ctx.addIssue({
        code: "custom",
        message: `데스크톱 배치가 겹칩니다: ${a}, ${b}`,
        path: ["layout", "desktop"],
      });
    }
  });
export type Page = z.infer<typeof PageSchema>;

/** 소개 페이지 기본값. 소개 페이지가 생기기 전에 저장한 문서에는 이 페이지를 덧붙인다. */
export function createAboutPage(): Page {
  return {
    id: "page_about",
    kind: "system",
    systemKey: "about",
    title: "소개",
    description: "어떤 개발자인지, 어떻게 일하는지 소개합니다.",
    modules: [],
    layout: {
      desktop: { columns: 12, items: [] },
      mobile: { columns: 2, strategy: "auto", items: [] },
    },
  };
}

export const NavItemSchema = z.object({
  id: IdSchema,
  label: z.string().min(1).max(20),
  href: HrefSchema,
});
export type NavItem = z.infer<typeof NavItemSchema>;

export const SiteSettingsSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().max(160),
  navigation: z.array(NavItemSchema).min(1).max(8),
  /**
   * 머리글 이름 앞의 표시. 없으면 이름 첫 글자를 보여준다(이전 문서와 호환).
   * image가 있으면 로고 이미지를, 없으면 이름 첫 글자를 보여주고, hidden이면 아무것도 보여주지 않는다.
   */
  logo: z.object({ hidden: z.boolean(), image: ImageMediaSchema.optional() }).optional(),
  footer: z.object({
    links: z.array(LinkSchema).max(6),
    note: z.string().max(120).optional(),
  }),
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
