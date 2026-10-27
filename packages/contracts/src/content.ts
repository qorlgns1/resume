import { z } from "zod";
import { BlockSchema } from "./blocks";
import {
  IdSchema,
  LinkSchema,
  MediaSchema,
  PeriodSchema,
  SlugSchema,
  YearMonthSchema,
} from "./primitives";

/*
 * 원본 콘텐츠(Content Library).
 * 페이지의 모듈 인스턴스는 이 콘텐츠를 ID로 참조할 뿐 복제하지 않는다.
 * 같은 프로젝트를 홈과 프로젝트 목록에서 서로 다른 모듈로 보여줄 수 있다.
 */

export const ProfileSchema = z.object({
  name: z.string().min(1).max(40),
  /** 화면 상단 등에 쓰는 한글 직무명 */
  role: z.string().min(1).max(40),
  /** 대표 카드의 영문 eyebrow */
  roleEyebrow: z.string().max(40).optional(),
  /** 줄바꿈(\n)으로 행을 나누는 대표 문구 */
  headline: z.string().min(1).max(80),
  summary: z.string().max(200),
  principles: z
    .array(
      z.object({
        id: IdSchema,
        title: z.string().min(1).max(30),
        keywords: z.array(z.string().max(20)).max(4),
      }),
    )
    .max(4),
});
export type Profile = z.infer<typeof ProfileSchema>;

/** 프로젝트 카드의 아이콘. 임의 SVG 대신 정해진 키만 저장한다. */
export const ProjectIconSchema = z.enum(["home", "pen", "leaf", "clock", "code", "sparkles"]);
export const ProjectToneSchema = z.enum(["blue", "violet", "green", "slate"]);
export const ProjectStatusSchema = z.enum(["live", "in-development", "paused", "archived"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  kind: z.literal("personal"),
  title: z.string().min(1).max(40),
  tagline: z.string().max(80),
  summary: z.string().max(240),
  status: ProjectStatusSchema,
  icon: ProjectIconSchema,
  tone: ProjectToneSchema,
  /** 플랫폼·역할·기술 등 짧은 메타 태그 */
  tags: z.array(z.string().max(24)).max(6),
  period: PeriodSchema.optional(),
  cover: MediaSchema.optional(),
  links: z.array(LinkSchema).max(6),
  /** 상세 페이지 본문 (노션형 블록). 이번 단계에서는 비어 있을 수 있다. */
  body: z.array(BlockSchema),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CompanySchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  name: z.string().min(1).max(40),
  role: z.string().max(40),
  period: PeriodSchema,
  summary: z.string().max(120),
  tags: z.array(z.string().max(24)).max(6),
  body: z.array(BlockSchema),
});
export type Company = z.infer<typeof CompanySchema>;

export const AchievementSchema = z.object({
  id: IdSchema,
  /** 분류 태그 (예: "회사 A", "품질 개선") */
  context: z.array(z.string().max(24)).max(3),
  title: z.string().min(1).max(60),
  metric: z
    .object({
      label: z.string().max(24),
      before: z.string().max(16),
      after: z.string().max(16),
    })
    .optional(),
  description: z.string().max(200),
  companyId: IdSchema.optional(),
  projectId: IdSchema.optional(),
});
export type Achievement = z.infer<typeof AchievementSchema>;

export const TechStackGroupSchema = z.object({
  id: IdSchema,
  label: z.string().min(1).max(24),
  items: z.array(z.string().min(1).max(32)).min(1).max(16),
});
export type TechStackGroup = z.infer<typeof TechStackGroupSchema>;

/** 히스토리 항목은 기존 회사·프로젝트를 참조하거나 직접 작성한다. */
export const HistoryEntrySchema = z.object({
  id: IdSchema,
  date: YearMonthSchema,
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  ref: z.object({ kind: z.enum(["project", "company"]), id: IdSchema }).optional(),
});
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const HistoryChapterSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(40),
  summary: z.string().max(200),
  period: PeriodSchema,
  entries: z.array(HistoryEntrySchema),
});
export type HistoryChapter = z.infer<typeof HistoryChapterSchema>;

export const ContentLibrarySchema = z.object({
  profile: ProfileSchema,
  projects: z.array(ProjectSchema),
  companies: z.array(CompanySchema),
  achievements: z.array(AchievementSchema),
  techStack: z.array(TechStackGroupSchema),
  history: z.object({ chapters: z.array(HistoryChapterSchema) }),
});
export type ContentLibrary = z.infer<typeof ContentLibrarySchema>;
