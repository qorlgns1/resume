import path from "node:path";
import { defineConfig } from "vitest/config";

/*
 * 단위 테스트. 빌드 없이 소스 그대로 실행한다: `pnpm test`
 * 각 앱·패키지를 프로젝트로 나눠 `@/` 별칭을 따로 둔다.
 * `server-only`는 Next 서버 컴포넌트 밖에서 import하면 바로 throw하므로 빈 모듈로 바꾼다.
 */

const serverOnlyStub = path.resolve(import.meta.dirname, "test/stubs/server-only.ts");

const project = (name: string, root: string) => ({
  test: {
    name,
    root: path.resolve(import.meta.dirname, root),
    include: ["src/**/*.test.ts"],
    environment: "node" as const,
  },
  resolve: {
    alias: {
      "@/": `${path.resolve(import.meta.dirname, root, "src")}/`,
      "server-only": serverOnlyStub,
    },
  },
});

export default defineConfig({
  test: {
    projects: [
      project("contracts", "packages/contracts"),
      project("admin", "apps/admin"),
      project("web", "apps/web"),
    ],
  },
});
