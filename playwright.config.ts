import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/*
 * 스모크 검증. 빌드 결과물을 실행해서 확인한다: `pnpm build && pnpm test:smoke`
 * 다른 로컬 서비스와 겹치지 않도록 기본 개발 포트(3000/3001) 대신 31xx를 사용한다.
 */
export const ports = {
  web: 3100, // 샘플 모드
  admin: 3101,
  webApi: 3102, // API 모드 → admin
  webApiDown: 3103, // API 모드 → 응답 없는 주소 (오류 상태 확인)
  unreachable: 3999,
} as const;

const start = (filter: string, port: number) =>
  `pnpm --filter ${filter} exec next start --port ${port}`;

/** 테스트용 관리자 계정. 매 실행마다 빈 DB에 CLI로 새로 만든다. */
export const testAdmin = { username: "owner", password: "smoke-test-password" } as const;
const adminDatabase = path.resolve("test-results/smoke-data/resume.db");

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/smoke",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  webServer: [
    {
      // 빈 DB → CLI로 관리자 생성 → 서버 시작 (서버가 시작할 때 샘플로 초안·게시본을 채운다)
      command: [
        `rm -rf ${path.dirname(adminDatabase)}`,
        "pnpm --filter @resume/admin exec node dist/cli.mjs create",
        start("@resume/admin", ports.admin),
      ].join(" && "),
      url: `http://localhost:${ports.admin}/api/health`,
      env: {
        DATABASE_PATH: adminDatabase,
        AUTH_SECRET: "smoke-test-secret-0123456789-abcdefghij",
        ADMIN_URL: `http://localhost:${ports.admin}`,
        ADMIN_USERNAME: testAdmin.username,
        ADMIN_PASSWORD: testAdmin.password,
        PUBLIC_SITE_URL: `http://localhost:${ports.web}`,
      },
      reuseExistingServer: false,
    },
    {
      command: start("@resume/web", ports.web),
      url: `http://localhost:${ports.web}/`,
      env: { CONTENT_SOURCE: "sample" },
      reuseExistingServer: false,
    },
    {
      command: start("@resume/web", ports.webApi),
      url: `http://localhost:${ports.webApi}/`,
      env: { CONTENT_SOURCE: "api", CONTENT_API_URL: `http://localhost:${ports.admin}` },
      reuseExistingServer: false,
    },
    {
      command: start("@resume/web", ports.webApiDown),
      url: `http://localhost:${ports.webApiDown}/`,
      env: {
        CONTENT_SOURCE: "api",
        CONTENT_API_URL: `http://localhost:${ports.unreachable}`,
        CONTENT_API_TIMEOUT_MS: "1500",
      },
      reuseExistingServer: false,
    },
  ],
});
