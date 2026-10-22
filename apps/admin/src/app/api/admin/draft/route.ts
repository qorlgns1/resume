import { SaveDraftRequestSchema } from "@resume/contracts";
import { json, readJson, withAdmin } from "@/server/admin-api";
import { getDraftState, saveDraft } from "@/server/site-repository";

export const dynamic = "force-dynamic";

/** 현재 초안 상태 */
export function GET(request: Request) {
  return withAdmin(request, () => json({ draft: getDraftState() }));
}

/** 초안 저장. revision이 현재 값과 다르면 409 */
export function PUT(request: Request) {
  return withAdmin(request, async () => {
    const body = await readJson(request, SaveDraftRequestSchema);
    return json({ draft: saveDraft(body) });
  });
}
