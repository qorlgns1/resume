import { sampleContent, samplePages, sampleSite } from "@resume/contracts/samples";
import { connection } from "next/server";
import { Editor } from "@/components/editor/editor";

export default async function AdminHomePage() {
  // PUBLIC_SITE_URL을 빌드 시점이 아닌 실행 시점에 읽는다.
  await connection();
  const publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim() || null;

  return (
    <Editor
      pages={samplePages}
      content={sampleContent}
      site={sampleSite}
      publicSiteUrl={publicSiteUrl}
    />
  );
}
