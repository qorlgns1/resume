import { SystemPage, systemPageMetadata } from "@/lib/content/system-page";

export function generateMetadata() {
  return systemPageMetadata("projects");
}

export default function ProjectsPage() {
  return <SystemPage pageKey="projects" />;
}
