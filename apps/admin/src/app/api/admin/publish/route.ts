import { PublishRequestSchema } from "@resume/contracts";
import { json, readJson, withAdmin } from "@/server/admin-api";
import { publishDraft } from "@/server/site-repository";

export const dynamic = "force-dynamic";

/** 현재 초안을 새 버전으로 게시. 바뀐 것이 없으면 422 */
export function POST(request: Request) {
  return withAdmin(request, async () => {
    const body = await readJson(request, PublishRequestSchema);
    return json(publishDraft(body), 201);
  });
}
