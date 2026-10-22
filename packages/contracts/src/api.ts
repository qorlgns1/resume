import { z } from "zod";
import { ContentLibrarySchema } from "./content";
import { PageSchema, SiteSettingsSchema } from "./page";
import { findMissingReferences } from "./references";

/*
 * 공개 콘텐츠 API 계약 (v1).
 *
 * 현재 응답은 어드민 앱의 샘플 데이터이며 최종 저장 구조가 아니다.
 * DB·게시 흐름이 정해지면 data의 모양은 유지하되 meta.source가 "published"로 바뀌고,
 * content는 페이지가 참조하는 항목만 담도록 줄일 수 있다.
 */

export const PUBLIC_API_VERSION = 1;

export const publicApiPaths = {
  page: (key: string) => `/api/public/v1/pages/${encodeURIComponent(key)}`,
} as const;

export const PublicPageResponseSchema = z
  .object({
    schemaVersion: z.literal(PUBLIC_API_VERSION),
    data: z.object({
      site: SiteSettingsSchema,
      page: PageSchema,
      content: ContentLibrarySchema,
    }),
    meta: z.object({
      /** sample: 저장소에 포함된 샘플 데이터, published: 게시된 버전 */
      source: z.enum(["sample", "published"]),
      generatedAt: z.iso.datetime(),
      /** 게시 버전 번호. 샘플에는 없다. */
      version: z.number().int().positive().optional(),
    }),
  })
  .superRefine((res, ctx) => {
    for (const missing of findMissingReferences(res.data.page, res.data.content)) {
      ctx.addIssue({
        code: "custom",
        message: `모듈 ${missing.moduleId}가 존재하지 않는 ${missing.kind} ${missing.id}를 참조합니다.`,
        path: ["data", "content"],
      });
    }
  });
export type PublicPageResponse = z.infer<typeof PublicPageResponseSchema>;
export type PublicPageData = PublicPageResponse["data"];

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "not_found",
      "invalid_request",
      "internal_error",
      // 관리자 API
      "unauthorized", // 로그인 필요
      "forbidden", // 허용되지 않은 출처(Origin)
      "conflict", // 다른 곳에서 초안이 먼저 바뀜 (revision 불일치)
      "nothing_to_publish", // 초안이 최근 게시본과 같음
    ]),
    message: z.string(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
