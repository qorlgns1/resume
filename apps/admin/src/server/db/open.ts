import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface OpenedDatabase {
  sqlite: Database.Database;
  db: AppDatabase;
}

/**
 * SQLite 파일을 열고 마이그레이션을 적용한다. Next 서버와 CLI가 함께 쓴다.
 * WAL 모드로 읽기와 쓰기가 서로 막지 않게 한다.
 */
export function openDatabase(file: string, migrationsDir: string): OpenedDatabase {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: migrationsDir });
  return { sqlite, db };
}
