import { z } from "zod";
import { ContentLibrarySchema } from "./content";
import { PageSchema, SiteSettingsSchema } from "./page";

/*
 * 초안·게시·버전 기록을 위한 잠정 타입.
 * 콘텐츠와 배치를 하나의 문서(SiteDocument)로 묶어 함께 버전 관리한다.
 * 저장소(DB)와 API가 정해지기 전까지 어떤 코드도 이 타입으로 데이터를 저장하지 않는다.
 */

export const SiteDocumentSchema = z.object({
  site: SiteSettingsSchema,
  content: ContentLibrarySchema,
  pages: z.array(PageSchema).min(1),
});
export type SiteDocument = z.infer<typeof SiteDocumentSchema>;

export const DraftSchema = z.object({
  /** 이 초안이 출발한 게시 버전. 아직 게시한 적이 없으면 null */
  baseVersion: z.number().int().positive().nullable(),
  updatedAt: z.iso.datetime(),
  document: SiteDocumentSchema,
});
export type Draft = z.infer<typeof DraftSchema>;

export const PublishedVersionSchema = z.object({
  version: z.number().int().positive(),
  publishedAt: z.iso.datetime(),
  note: z.string().max(200).optional(),
  /** 이전 버전 복원 시 어느 버전에서 복원했는지 기록 */
  restoredFrom: z.number().int().positive().optional(),
  document: SiteDocumentSchema,
});
export type PublishedVersion = z.infer<typeof PublishedVersionSchema>;
