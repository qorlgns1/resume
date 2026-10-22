import "server-only";
import { getDatabasePath, getMigrationsDir } from "../env";
import { type AppDatabase, type OpenedDatabase, openDatabase } from "./open";

export type { AppDatabase };

// 개발 서버의 모듈 재로딩에도 연결을 하나만 유지한다.
const globalState = globalThis as typeof globalThis & { __resumeDb?: OpenedDatabase };

/**
 * DB 연결. 처음 호출할 때 파일을 만들고 마이그레이션을 적용한다.
 * 빌드 중에는 호출되지 않도록 요청 처리 경로에서만 사용한다.
 */
export function getDb(): AppDatabase {
  globalState.__resumeDb ??= openDatabase(getDatabasePath(), getMigrationsDir());
  return globalState.__resumeDb.db;
}
