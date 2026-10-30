import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import Database from "better-sqlite3";

/*
 * 실행 중 백업. 어드민을 멈추지 않고 한 시점의 완전한 사본을 만든다.
 *
 * - DB: SQLite `VACUUM INTO`로 읽기 트랜잭션 하나를 열고 그 시점의 내용을 새 파일에 쓴다.
 *   WAL에만 있는 최근 변경도 포함되고, 그 사이의 쓰기는 사본에 섞이지도 막히지도 않는다.
 *   결과는 WAL 없이 혼자 열리는 단일 파일이다.
 * - 미디어: 업로드 이미지는 저장 후 바뀌지 않고, 삭제는 어디서도 쓰지 않는 것만 되므로 폴더를 그대로 담는다.
 * - 둘을 manifest.json과 함께 tar.gz 하나로 묶는다. tar는 Docker(alpine busybox)와 일반 환경 모두에 있다.
 */

const run = promisify(execFile);

export interface BackupOptions {
  databasePath: string;
  /** 업로드 이미지 폴더. 없으면 DB만 담는다. */
  mediaDir: string;
  /** 결과 파일을 둘 폴더. 없으면 만든다. */
  outDir: string;
  now?: Date;
}

export interface BackupResult {
  file: string;
  bytes: number;
  publishedVersions: number;
  latestVersion: number | null;
  mediaFiles: number;
}

/** 파일 이름에 쓰는 시각: resume-backup-20260130-142530.tar.gz */
export function backupFileName(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  return `resume-backup-${stamp}.tar.gz`;
}

/** 실행 중인 DB의 일관된 사본을 target에 쓴다. 원본은 바뀌지 않는다. */
export function snapshotDatabase(databasePath: string, target: string): void {
  const db = new Database(databasePath);
  try {
    // SQL 문자열 안의 작은따옴표는 두 번 써서 이스케이프한다.
    db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
  } finally {
    db.close();
  }
}

async function countFiles(dir: string): Promise<number> {
  let count = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) count++;
  }
  return count;
}

async function exists(file: string): Promise<boolean> {
  return fs
    .access(file)
    .then(() => true)
    .catch(() => false);
}

/** 같은 초에 두 번 실행해도 앞의 백업을 덮어쓰지 않도록 -2, -3을 붙인다. */
async function uniquePath(file: string): Promise<string> {
  if (!(await exists(file))) return file;
  const base = file.replace(/\.tar\.gz$/, "");
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}.tar.gz`;
    if (!(await exists(candidate))) return candidate;
  }
}

export async function createBackup({
  databasePath,
  mediaDir,
  outDir,
  now = new Date(),
}: BackupOptions): Promise<BackupResult> {
  if (!(await exists(databasePath))) {
    throw new Error(`DB 파일이 없습니다: ${databasePath}`);
  }
  await fs.mkdir(outDir, { recursive: true });
  const file = await uniquePath(path.join(outDir, backupFileName(now)));
  // 묶기 전의 작업 폴더. 백업 파일과 같은 곳에 두어 같은 디스크 안에서 끝낸다.
  const staging = await fs.mkdtemp(path.join(outDir, ".backup-"));

  try {
    const dbCopy = path.join(staging, "resume.db");
    snapshotDatabase(databasePath, dbCopy);

    let mediaFiles = 0;
    if (await exists(mediaDir)) {
      await fs.cp(mediaDir, path.join(staging, "media"), { recursive: true });
      mediaFiles = await countFiles(path.join(staging, "media"));
    }

    // 사본을 읽어 요약을 남긴다. 복원할 때 어느 시점의 백업인지 바로 알 수 있다.
    const copy = new Database(dbCopy, { readonly: true });
    let publishedVersions = 0;
    let latestVersion: number | null = null;
    try {
      const row = copy
        .prepare("SELECT COUNT(*) AS count, MAX(version) AS latest FROM published_versions")
        .get() as { count: number; latest: number | null };
      publishedVersions = row.count;
      latestVersion = row.latest;
    } finally {
      copy.close();
    }
    await fs.writeFile(
      path.join(staging, "manifest.json"),
      `${JSON.stringify(
        {
          createdAt: now.toISOString(),
          databasePath,
          mediaDir,
          publishedVersions,
          latestVersion,
          mediaFiles,
          restore:
            "어드민을 멈춘 뒤 resume.db를 DATABASE_PATH에, media/를 MEDIA_DIR에 넣고 다시 시작합니다. 기존 resume.db-wal, resume.db-shm 파일은 지웁니다.",
        },
        null,
        2,
      )}\n`,
    );

    await run("tar", ["-czf", file, "-C", staging, "."]);
    const { size } = await fs.stat(file);
    return { file, bytes: size, publishedVersions, latestVersion, mediaFiles };
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

/** 백업 폴더에서 가장 최근 keep개만 남기고 지운다. 지운 파일 이름을 돌려준다. */
export async function pruneBackups(outDir: string, keep: number): Promise<string[]> {
  if (!Number.isInteger(keep) || keep < 1) throw new Error("keep은 1 이상의 정수여야 합니다.");
  const names = (await fs.readdir(outDir))
    .filter((name) => /^resume-backup-\d{8}-\d{6}(-\d+)?\.tar\.gz$/.test(name))
    .sort();
  const stale = names.slice(0, Math.max(0, names.length - keep));
  for (const name of stale) await fs.rm(path.join(outDir, name));
  return stale;
}
