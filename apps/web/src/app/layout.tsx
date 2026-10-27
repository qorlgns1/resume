import "@resume/tokens/font.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

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
      </body>
    </html>
  );
}
