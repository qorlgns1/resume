import "@resume/tokens/font.css";
import "./globals.css";
import { TooltipProvider } from "@resume/ui/components/tooltip";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "포트폴리오 어드민",
  // 어드민은 검색 엔진에 노출하지 않는다.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-muted">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
