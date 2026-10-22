import { SystemPage, systemPageMetadata } from "@/lib/content/system-page";

export function generateMetadata() {
  return systemPageMetadata("experience");
}

export default function ExperiencePage() {
  return (
    <SystemPage
      pageKey="experience"
      planned="회사별 경험 목록과 회사별 상세 페이지가 이곳에 들어갈 예정입니다."
    />
  );
}
