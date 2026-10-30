import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "../..");

/** 모든 응답에 붙이는 보안 헤더. 공개 사이트(apps/web/next.config.ts)와 같은 값이다. */
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
  turbopack: { root: monorepoRoot },
  // 공통 패키지는 빌드 없이 TypeScript 소스로 배포하고 앱이 함께 컴파일한다.
  transpilePackages: ["@resume/contracts", "@resume/modules", "@resume/tokens", "@resume/ui"],
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
};

export default nextConfig;
