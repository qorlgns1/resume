import { connection } from "next/server";
import { Editor } from "@/components/editor/editor";
import { requireSession } from "@/server/auth";
import { getDraftState } from "@/server/site-repository";

export default async function AdminHomePage({ searchParams }: PageProps<"/">) {
  // 환경 변수와 DB를 빌드 시점이 아닌 요청 시점에 읽는다.
  await connection();
  const session = await requireSession();
  const draft = getDraftState();
  const publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim() || null;
  // 새로고침해도 편집하던 페이지에 머물도록 주소의 ?page=를 읽는다.
  const { page } = await searchParams;

  return (
    <Editor
      initialDraft={draft}
      initialPageId={typeof page === "string" ? page : null}
      publicSiteUrl={publicSiteUrl}
      userName={session.user.displayUsername ?? session.user.username ?? session.user.name}
    />
  );
}
