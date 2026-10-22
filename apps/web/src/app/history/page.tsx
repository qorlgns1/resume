import { SystemPage, systemPageMetadata } from "@/lib/content/system-page";

export function generateMetadata() {
  return systemPageMetadata("history");
}

export default function HistoryPage() {
  return (
    <SystemPage
      pageKey="history"
      planned="챕터와 타임라인으로 구성한 히스토리가 이곳에 들어갈 예정입니다."
    />
  );
}
