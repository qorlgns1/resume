import { SystemPage, systemPageMetadata } from "@/lib/content/system-page";

export function generateMetadata() {
  return systemPageMetadata("about");
}

export default function AboutPage() {
  return <SystemPage pageKey="about" />;
}
