// CLI를 의존성까지 포함한 단일 파일(dist/cli.mjs)로 묶는다.
// Docker 실행 이미지에는 pnpm·tsx·소스가 없으므로 node로 바로 실행할 수 있어야 한다.
// 네이티브 모듈인 better-sqlite3만 외부로 남긴다(standalone 출력에 포함됨).
import { build } from "esbuild";

await build({
  entryPoints: ["scripts/cli.ts"],
  outfile: "dist/cli.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  external: ["better-sqlite3"],
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: "warning",
});
