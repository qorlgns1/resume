import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { backupFileName, createBackup, pruneBackups } from "./backup";
import { openDatabase } from "./db/open";
import { getDraftState, publishDraft, saveDraft, seedIfEmpty } from "./site-repository";

const run = promisify(execFile);
const migrationsDir = path.resolve(__dirname, "../../drizzle");

/*
 * 실제 SQLite 파일(WAL 모드)과 마이그레이션으로 백업을 만들고, 풀어서 내용을 확인한다.
 * 어드민이 켜져 있는 상황을 흉내 내기 위해 원본 연결을 열어 둔 채로 백업한다.
 */

let root: string;
let databasePath: string;
let mediaDir: string;
let outDir: string;
let live: ReturnType<typeof openDatabase>;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "resume-backup-"));
  databasePath = path.join(root, "data", "resume.db");
  mediaDir = path.join(root, "data", "media");
  outDir = path.join(root, "backups");
  live = openDatabase(databasePath, migrationsDir);
  seedIfEmpty(live.db);
  await fs.mkdir(path.join(mediaDir, "med_0123456789abcdef"), { recursive: true });
  await fs.writeFile(path.join(mediaDir, "med_0123456789abcdef", "480.webp"), "webp-bytes");
});

afterEach(async () => {
  live.sqlite.close();
  await fs.rm(root, { recursive: true, force: true });
});

async function extract(file: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(root, "extract-"));
  await run("tar", ["-xzf", file, "-C", dir]);
  return dir;
}

describe("backupFileName", () => {
  it("stamps local date and time, zero padded", () => {
    expect(backupFileName(new Date(2026, 0, 5, 9, 7, 3))).toBe(
      "resume-backup-20260105-090703.tar.gz",
    );
  });
});

describe("createBackup", () => {
  it("captures changes that are only in the WAL while the admin connection stays open", async () => {
    const state = getDraftState(live.db);
    const saved = saveDraft(
      {
        revision: state.revision,
        document: { ...state.document, site: { ...state.document.site, title: "백업 직전 제목" } },
      },
      live.db,
    );
    publishDraft({ revision: saved.revision, note: "백업 테스트" }, live.db);
    // WAL 파일이 실제로 있고(체크포인트 전), 원본 연결은 열린 채다.
    await expect(fs.stat(`${databasePath}-wal`)).resolves.toBeTruthy();

    const result = await createBackup({
      databasePath,
      mediaDir,
      outDir,
      now: new Date(2026, 9, 30, 12, 0, 0),
    });
    expect(result.file).toBe(path.join(outDir, "resume-backup-20261030-120000.tar.gz"));
    expect(result.publishedVersions).toBe(2);
    expect(result.latestVersion).toBe(2);
    expect(result.mediaFiles).toBe(1);
    expect(result.bytes).toBeGreaterThan(0);

    const dir = await extract(result.file);
    const copy = new Database(path.join(dir, "resume.db"), { readonly: true });
    try {
      const row = copy
        .prepare("SELECT document FROM published_versions WHERE version = 2")
        .get() as { document: string };
      expect(JSON.parse(row.document).site.title).toBe("백업 직전 제목");
    } finally {
      copy.close();
    }
    // 사본은 WAL 없이 혼자 열린다.
    await expect(fs.stat(path.join(dir, "resume.db-wal"))).rejects.toThrow();
    await expect(
      fs.readFile(path.join(dir, "media", "med_0123456789abcdef", "480.webp"), "utf8"),
    ).resolves.toBe("webp-bytes");
    const manifest = JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf8"));
    expect(manifest).toMatchObject({ publishedVersions: 2, latestVersion: 2, mediaFiles: 1 });
  });

  it("does not modify the live database or leave staging files behind", async () => {
    const before = getDraftState(live.db);
    await createBackup({ databasePath, mediaDir, outDir });
    expect(getDraftState(live.db)).toEqual(before);
    const leftovers = (await fs.readdir(outDir)).filter((n) => n.startsWith(".backup-"));
    expect(leftovers).toEqual([]);
  });

  it("works without a media folder and fails clearly without a database", async () => {
    const result = await createBackup({ databasePath, mediaDir: path.join(root, "nope"), outDir });
    expect(result.mediaFiles).toBe(0);
    await expect(
      createBackup({ databasePath: path.join(root, "missing.db"), mediaDir, outDir }),
    ).rejects.toThrow("DB 파일이 없습니다");
  });
});

describe("pruneBackups", () => {
  it("keeps the newest N backups and ignores other files", async () => {
    await fs.mkdir(outDir, { recursive: true });
    for (const day of ["01", "02", "03", "04"]) {
      await fs.writeFile(path.join(outDir, `resume-backup-202601${day}-000000.tar.gz`), "");
    }
    await fs.writeFile(path.join(outDir, "notes.txt"), "");
    const removed = await pruneBackups(outDir, 2);
    expect(removed).toEqual([
      "resume-backup-20260101-000000.tar.gz",
      "resume-backup-20260102-000000.tar.gz",
    ]);
    expect((await fs.readdir(outDir)).sort()).toEqual([
      "notes.txt",
      "resume-backup-20260103-000000.tar.gz",
      "resume-backup-20260104-000000.tar.gz",
    ]);
    await expect(pruneBackups(outDir, 0)).rejects.toThrow();
  });
});

describe("createBackup (same second twice)", () => {
  it("does not overwrite an earlier backup made in the same second", async () => {
    const now = new Date(2026, 9, 30, 12, 0, 0);
    const first = await createBackup({ databasePath, mediaDir, outDir, now });
    const second = await createBackup({ databasePath, mediaDir, outDir, now });
    expect(path.basename(first.file)).toBe("resume-backup-20261030-120000.tar.gz");
    expect(path.basename(second.file)).toBe("resume-backup-20261030-120000-2.tar.gz");
    expect(await pruneBackups(outDir, 1)).toEqual(["resume-backup-20261030-120000.tar.gz"]);
  });
});
