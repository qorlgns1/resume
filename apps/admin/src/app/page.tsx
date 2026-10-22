import { connection } from "next/server";
import { Editor } from "@/components/editor/editor";
import { requireSession } from "@/server/auth";
import { getDraftState } from "@/server/site-repository";

export default async function AdminHomePage() {
  // 환경 변수와 DB를 빌드 시점이 아닌 요청 시점에 읽는다.
  await connection();
  const session = await requireSession();
  const draft = getDraftState();
  const publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim() || null;

  return (
    <Editor
      initialDraft={draft}
      publicSiteUrl={publicSiteUrl}
      userName={session.user.displayUsername ?? session.user.username ?? session.user.name}
    />
  );
}
