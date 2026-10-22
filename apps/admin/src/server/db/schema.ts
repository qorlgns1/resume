/*
 * 어드민 DB 스키마 (SQLite).
 *
 * 1) 사이트 문서: 콘텐츠와 배치를 SiteDocument JSON 하나로 묶어 저장한다.
 *    - site_draft: 편집 중인 초안 1행
 *    - published_versions: 게시할 때마다 1행씩 쌓이는 버전 기록
 *    JSON의 모양은 @resume/contracts의 SiteDocumentSchema가 책임지며, 읽고 쓸 때 항상 검증한다.
 * 2) 인증: Better Auth 테이블. `pnpm dlx auth@1.7.12 generate`로 생성한 정의를 그대로 옮겼다.
 *
 * 스키마를 바꾸면 `pnpm --filter @resume/admin db:generate`로 마이그레이션을 새로 추가한다.
 * 이미 커밋한 마이그레이션 파일은 수정하거나 다시 생성하지 않는다. 기존 DB에 같은 변경이 두 번 적용되어 시작이 실패한다.
 */
import { relations, sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ── 인증 (Better Auth) ──────────────────────────────────

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ── 사이트 문서 ─────────────────────────────────────────

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const siteDraft = sqliteTable(
  "site_draft",
  {
    /** 초안은 항상 1행이다. */
    id: integer("id").primaryKey(),
    /** SiteDocument JSON */
    document: text("document", { mode: "json" }).notNull(),
    /** 이 초안이 출발한 게시 버전. 게시한 적이 없으면 null */
    baseVersion: integer("base_version"),
    /** 저장할 때마다 1씩 증가. 다른 탭의 변경을 덮어쓰지 않도록 비교에 쓴다. */
    revision: integer("revision").notNull().default(1),
    /** 이전 버전을 복원한 초안이면 그 버전 번호. 게시할 때 published_versions.restored_from으로 옮긴다. */
    restoredFrom: integer("restored_from"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [check("site_draft_single_row", sql`${table.id} = 1`)],
);

export const publishedVersions = sqliteTable("published_versions", {
  version: integer("version").primaryKey(),
  /** SiteDocument JSON */
  document: text("document", { mode: "json" }).notNull(),
  note: text("note"),
  /** 이전 버전을 복원해 게시한 경우 그 버전 번호 */
  restoredFrom: integer("restored_from"),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }).default(now).notNull(),
});

// ── 미디어 ──────────────────────────────────────────────

/** 업로드한 이미지. 파일은 MEDIA_DIR/{id}/{width}.webp, 원본은 저장하지 않는다. */
export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  originalName: text("original_name").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  /** 만들어 둔 변환본 너비 목록 */
  widths: text("widths", { mode: "json" }).$type<number[]>().notNull(),
  bytes: integer("bytes").notNull(),
  animated: integer("animated", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
});
