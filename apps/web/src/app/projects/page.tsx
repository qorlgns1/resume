import { SystemPage, systemPageMetadata } from "@/lib/content/system-page";

export function generateMetadata() {
  return systemPageMetadata("projects");
}

export default function ProjectsPage() {
  return (
    <SystemPage
      pageKey="projects"
      planned="개인 프로젝트 목록과 프로젝트별 상세 페이지가 이곳에 들어갈 예정입니다."
    />
  );
}
