import path from "node:path";

/*
 * 어드민 서버 설정. 모두 실행 시점에 읽는다(빌드 시점에 필요하지 않음).
 *
 * DATABASE_PATH  SQLite 파일 경로. 기본값 ./data/resume.db (Docker: /data/resume.db)
 * MEDIA_DIR      이미지 저장 폴더 (미디어 단계에서 사용). 기본값: DB 파일 옆 media/
 * BACKUP_DIR     `cli backup`이 tar.gz를 두는 폴더. 기본값: DB 파일 옆 backups/
 * AUTH_SECRET    세션 서명 키. 운영(production)에서는 필수
 * ADMIN_URL      브라우저가 접속하는 어드민 주소. 로그인 요청의 출처(Origin) 검사에 쓴다
 */

const DEV_AUTH_SECRET = "dev-only-insecure-secret-change-me-0000000000";

export function getDatabasePath(): string {
  // 실행 중에 만드는 데이터 파일이므로 빌드 출력 추적에서 제외한다.
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.DATABASE_PATH?.trim() || "./data/resume.db",
  );
}

export function getMigrationsDir(): string {
  // next start(standalone 포함)와 CLI 모두 apps/admin을 작업 폴더로 실행한다.
  // 마이그레이션 SQL은 Docker 이미지에 따로 복사한다.
  return path.resolve(/*turbopackIgnore: true*/ process.env.MIGRATIONS_DIR?.trim() || "./drizzle");
}

/** 업로드 이미지 폴더. 기본값은 DB 파일 옆의 media/ (Docker: /data/media) */
export function getMediaDir(): string {
  const dir = process.env.MEDIA_DIR?.trim();
  return dir
    ? path.resolve(/*turbopackIgnore: true*/ dir)
    : path.join(path.dirname(getDatabasePath()), "media");
}

/** 백업 파일 폴더. 기본값은 DB 파일 옆의 backups/ (Docker: /data/backups, 데이터 볼륨 안) */
export function getBackupDir(): string {
  const dir = process.env.BACKUP_DIR?.trim();
  return dir
    ? path.resolve(/*turbopackIgnore: true*/ dir)
    : path.join(path.dirname(getDatabasePath()), "backups");
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) {
    if (secret.length < 32) throw new Error("AUTH_SECRET은 32자 이상이어야 합니다.");
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET이 설정되지 않았습니다. `openssl rand -base64 32`로 만든 값을 지정하세요.",
    );
  }
  return DEV_AUTH_SECRET;
}

export function getAdminUrl(): string {
  const url = process.env.ADMIN_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_URL이 설정되지 않았습니다. 브라우저가 접속하는 어드민 주소를 지정하세요 (예: https://admin.example.com).",
    );
  }
  return `http://localhost:${process.env.PORT?.trim() || "3201"}`;
}
