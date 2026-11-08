import type { Metadata } from "next";
import { connection } from "next/server";
import { InterviewWorkspace } from "@/components/interview/interview-workspace";
import { requireSession } from "@/server/auth";
import { listInterviewNotes } from "@/server/interview-repository";
import { getDraftState } from "@/server/site-repository";

export const metadata: Metadata = { title: "면접 노트 · 포트폴리오 어드민" };

export default async function InterviewPage() {
  // 환경 변수와 DB를 빌드 시점이 아닌 요청 시점에 읽는다.
  await connection();
  const session = await requireSession();
  const notes = listInterviewNotes();
  // 노트에 연결할 프로젝트는 편집 중인 초안 기준이다. 게시 전에 추가한 프로젝트도 고를 수 있다.
  const projects = getDraftState().document.content.projects.map((p) => ({
    id: p.id,
    title: p.title,
  }));

  return (
    <InterviewWorkspace
      initialNotes={notes}
      projects={projects}
      userName={session.user.displayUsername ?? session.user.username ?? session.user.name}
    />
  );
}
