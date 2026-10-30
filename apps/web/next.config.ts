import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "../..");

/** 파비콘·공유 미리보기 이미지가 실행 중에 읽는 글꼴. standalone 출력에 포함되도록 적는다. */
const fontDir = "./node_modules/pretendard/dist/public/static/alternative";
const ogFonts = [`${fontDir}/Pretendard-Bold.ttf`, `${fontDir}/Pretendard-Regular.ttf`];

/**
 * 모든 응답에 붙이는 보안 헤더. 어드민(apps/admin/next.config.ts)도 같은 값을 쓴다.
 * - 다른 사이트 안에 끼워 넣기(클릭재킹) 금지, MIME 추측 금지, 참조 주소 최소화
 * - CSP는 스크립트 출처를 제한하지 않는다 (Next의 인라인 스크립트와 PostHog를 nonce 없이 쓰기 위해).
 * - HSTS는 HTTPS 응답에서만 효력이 있으므로 로컬 http 실행에는 영향이 없다.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Docker 이미지에서만 standalone 출력을 사용한다. Vercel은 기본 출력을 사용한다.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // 모노레포 루트까지 추적해야 packages/*의 파일이 standalone 출력에 포함된다.
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/icon": [`${fontDir}/Pretendard-Bold.ttf`],
    "/opengraph-image": ogFonts,
    "/projects/[slug]/opengraph-image": ogFonts,
    "/experience/[slug]/opengraph-image": ogFonts,
  },
  turbopack: { root: monorepoRoot },
  // 공통 패키지는 빌드 없이 TypeScript 소스로 배포하고 앱이 함께 컴파일한다.
  transpilePackages: ["@resume/contracts", "@resume/modules", "@resume/tokens", "@resume/ui"],
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
};

export default nextConfig;
