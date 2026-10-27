import { z } from "zod";
import { HrefSchema, IdSchema, LinkSchema } from "./primitives";
import { ModuleStyleSchema } from "./style";

/*
 * 모듈 인스턴스: 페이지에 배치된 하나의 카드.
 * - id는 안정적이어야 한다. 배치·버전 기록·선택 상태가 이 id를 기준으로 연결된다.
 * - props에는 모듈 고유 설정과 원본 콘텐츠 ID 참조만 둔다.
 * - 배치(layout)는 페이지에서 화면별로 따로 관리한다(layout.ts).
 */

export const MODULE_TYPES = [
  "intro",
  "projects",
  "achievements",
  "tech-stack",
  "status",
  "history-entry",
] as const;
export const ModuleTypeSchema = z.enum(MODULE_TYPES);
export type ModuleType = z.infer<typeof ModuleTypeSchema>;

/** 홈에 표시할 개인 프로젝트 최대 개수 */
export const MAX_HOME_PROJECTS = 3;

const ActionSchema = LinkSchema.extend({
  emphasis: z.enum(["primary", "secondary"]),
});

export const IntroPropsSchema = z.discriminatedUnion("variant", [
  z.object({
    variant: z.literal("hero"),
    showName: z.boolean(),
    actions: z.array(ActionSchema).max(4),
  }),
  z.object({
    /** 프로필의 principles를 가로 띠 형태로 표시 */
    variant: z.literal("principles"),
  }),
]);

export const ProjectsPropsSchema = z.discriminatedUnion("variant", [
  z.object({
    /** 한 프로젝트를 크게 보여주는 대표 카드 */
    variant: z.literal("spotlight"),
    eyebrow: z.string().max(30),
    projectId: IdSchema,
    link: LinkSchema.optional(),
  }),
  z.object({
    /** 1~3개 프로젝트 카드 목록 */
    variant: z.literal("grid"),
    heading: z.string().max(40),
    description: z.string().max(120).optional(),
    projectIds: z.array(IdSchema).min(1).max(MAX_HOME_PROJECTS),
    viewAll: LinkSchema.optional(),
    mediaNote: z.string().max(60).optional(),
  }),
]);

export const AchievementsPropsSchema = z.object({
  heading: z.string().max(40),
  description: z.string().max(120).optional(),
  achievementIds: z.array(IdSchema).min(1).max(4),
});

export const TechStackPropsSchema = z.object({
  heading: z.string().max(40),
  description: z.string().max(120).optional(),
  groupIds: z.array(IdSchema).min(1).max(6),
});

export const StatusPropsSchema = z.object({
  eyebrow: z.string().max(30),
  title: z.string().min(1).max(60),
  description: z.string().max(160),
  badge: z
    .object({
      label: z.string().max(16),
      tone: z.enum(["neutral", "primary", "success", "warning"]),
    })
    .optional(),
  items: z
    .array(z.object({ id: IdSchema, label: z.string().max(16), description: z.string().max(60) }))
    .max(4),
  link: LinkSchema.optional(),
});

/** 홈 경험 섹션에 표시할 회사 최대 개수 */
export const MAX_HISTORY_COMPANIES = 6;

const HistoryEntryPropsObjectSchema = z.object({
  heading: z.string().max(40),
  description: z.string().max(120).optional(),
  /** 시작일이 최근인 회사부터 몇 곳을 표시할지 */
  count: z.number().int().min(1).max(MAX_HISTORY_COMPANIES),
  link: z.object({ label: z.string().max(30), href: HrefSchema }),
});

/** 예전 형식(companyIds로 회사를 직접 고르던 설정)도 읽어서 고른 개수를 count로 바꾼다. */
export const HistoryEntryPropsSchema = z.preprocess((value) => {
  if (typeof value !== "object" || value === null || !("companyIds" in value)) return value;
  const { companyIds, ...rest } = value as { companyIds: unknown };
  return "count" in rest || !Array.isArray(companyIds)
    ? rest
    : { ...rest, count: companyIds.length };
}, HistoryEntryPropsObjectSchema);

const base = {
  id: IdSchema,
  /** 어드민 목록에 표시할 인스턴스 이름 */
  label: z.string().min(1).max(40),
  style: ModuleStyleSchema,
};

export const ModuleInstanceSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("intro"), props: IntroPropsSchema }),
  z.object({ ...base, type: z.literal("projects"), props: ProjectsPropsSchema }),
  z.object({ ...base, type: z.literal("achievements"), props: AchievementsPropsSchema }),
  z.object({ ...base, type: z.literal("tech-stack"), props: TechStackPropsSchema }),
  z.object({ ...base, type: z.literal("status"), props: StatusPropsSchema }),
  z.object({ ...base, type: z.literal("history-entry"), props: HistoryEntryPropsSchema }),
]);
export type ModuleInstance = z.infer<typeof ModuleInstanceSchema>;
export type ModuleInstanceOf<T extends ModuleType> = Extract<ModuleInstance, { type: T }>;
export type ModuleProps<T extends ModuleType> = ModuleInstanceOf<T>["props"];
