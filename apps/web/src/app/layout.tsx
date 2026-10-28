import "@resume/tokens/font.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Analytics } from "@/components/analytics";
import { readAnalyticsConfig } from "@/lib/analytics/config";

export const metadata: Metadata = {
  title: { default: "포트폴리오", template: "%s · 포트폴리오" },
};

export const viewport: Viewport = {
  themeColor: "#f2f3f5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-card px-4 py-2 font-semibold shadow-overlay focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          본문으로 건너뛰기
        </a>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}

/** 실행 시점의 환경 변수로 방문 분석을 켠다 (빌드 결과에 고정하지 않는다). */
async function SiteAnalytics() {
  await connection();
  const config = readAnalyticsConfig();
  return config ? <Analytics config={config} /> : null;
}
