import { z } from "zod";
import { ContentLibrarySchema } from "./content";
import { PageSchema, SiteSettingsSchema } from "./page";
import { findMissingReferences } from "./references";

/*
 * 초안·게시·버전 기록.
 * 콘텐츠와 배치를 하나의 문서(SiteDocument)로 묶어 함께 버전 관리한다.
 * 어드민은 초안 1개와 게시 버전 목록을 저장하고, 공개 API는 가장 최근 게시본만 제공한다.
 */

export const SiteDocumentSchema = z
  .object({
    site: SiteSettingsSchema,
    content: ContentLibrarySchema,
    pages: z.array(PageSchema).min(1),
  })
  .superRefine((document, ctx) => {
    const pageIds = new Set<string>();
    for (const page of document.pages) {
      if (pageIds.has(page.id)) {
        ctx.addIssue({
          code: "custom",
          message: `페이지 ID가 중복됩니다: ${page.id}`,
          path: ["pages"],
        });
      }
      pageIds.add(page.id);
      for (const missing of findMissingReferences(page, document.content)) {
        ctx.addIssue({
          code: "custom",
          message: `${page.title} 페이지의 모듈 ${missing.moduleId}가 없는 ${missing.kind} ${missing.id}를 참조합니다.`,
          path: ["pages"],
        });
      }
    }
    if (!document.pages.some((p) => p.kind === "system" && p.systemKey === "home")) {
      ctx.addIssue({ code: "custom", message: "홈 페이지가 없습니다.", path: ["pages"] });
    }
  });
export type SiteDocument = z.infer<typeof SiteDocumentSchema>;

/** 버전 기록 목록의 한 줄. 문서 본문은 담지 않는다. */
export const VersionSummarySchema = z.object({
  version: z.number().int().positive(),
  publishedAt: z.iso.datetime(),
  note: z.string().max(200).nullable(),
  /** 이전 버전을 복원해 게시한 경우 그 버전 번호 */
  restoredFrom: z.number().int().positive().nullable(),
});
export type VersionSummary = z.infer<typeof VersionSummarySchema>;

/** 어드민 편집 화면이 다루는 초안 상태 */
export const DraftStateSchema = z.object({
  document: SiteDocumentSchema,
  /** 저장할 때마다 1씩 증가. 저장·게시·복원 요청에 함께 보내 다른 곳의 변경을 덮어쓰지 않게 한다. */
  revision: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
  /** 지금 초안이 이전 버전을 복원한 결과라면 그 버전 번호. 게시하면 기록에 남는다. */
  restoredFrom: z.number().int().positive().nullable(),
  /** 가장 최근 게시 버전. 게시한 적이 없으면 null */
  latestVersion: z.number().int().positive().nullable(),
  /** 초안이 가장 최근 게시본과 다른지 */
  hasUnpublishedChanges: z.boolean(),
});
export type DraftState = z.infer<typeof DraftStateSchema>;

// ── 관리자 API 요청·응답 (/api/admin/*) ──────────────────

export const SaveDraftRequestSchema = z.object({
  revision: z.number().int().positive(),
  document: SiteDocumentSchema,
});
export type SaveDraftRequest = z.infer<typeof SaveDraftRequestSchema>;

export const PublishRequestSchema = z.object({
  revision: z.number().int().positive(),
  note: z.string().trim().max(200).optional(),
});
export type PublishRequest = z.infer<typeof PublishRequestSchema>;

export const RestoreRequestSchema = z.object({
  revision: z.number().int().positive(),
});
export type RestoreRequest = z.infer<typeof RestoreRequestSchema>;

export const DraftResponseSchema = z.object({ draft: DraftStateSchema });
export type DraftResponse = z.infer<typeof DraftResponseSchema>;

export const PublishResponseSchema = z.object({
  published: VersionSummarySchema,
  draft: DraftStateSchema,
});
export type PublishResponse = z.infer<typeof PublishResponseSchema>;

export const VersionListResponseSchema = z.object({ versions: z.array(VersionSummarySchema) });
export type VersionListResponse = z.infer<typeof VersionListResponseSchema>;

export const adminApiPaths = {
  draft: "/api/admin/draft",
  publish: "/api/admin/publish",
  versions: "/api/admin/versions",
  restore: (version: number) => `/api/admin/versions/${version}/restore`,
} as const;
