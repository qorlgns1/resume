import "@resume/tokens/font.css";
import "./globals.css";
import { TooltipProvider } from "@resume/ui/components/tooltip";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "포트폴리오 어드민 (로컬 검토용)",
  // 인증 전까지는 운영 서비스로 공개하지 않는다.
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
