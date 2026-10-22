import { SystemPage, systemPageMetadata } from "@/lib/content/system-page";

export function generateMetadata() {
  return systemPageMetadata("history");
}

export default function HistoryPage() {
  return <SystemPage pageKey="history" />;
}
