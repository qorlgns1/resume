import { SystemPage, systemPageMetadata } from "@/lib/content/system-page";

export function generateMetadata() {
  return systemPageMetadata("experience");
}

export default function ExperiencePage() {
  return <SystemPage pageKey="experience" />;
}
