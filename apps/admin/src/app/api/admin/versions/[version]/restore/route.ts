import { RestoreRequestSchema } from "@resume/contracts";
import { InvalidRequestError, json, readJson, withAdmin } from "@/server/admin-api";
import { restoreVersion } from "@/server/site-repository";

export const dynamic = "force-dynamic";

/** 이전 게시 버전을 초안으로 가져온다 (게시하지 않음) */
export function POST(
  request: Request,
  context: RouteContext<"/api/admin/versions/[version]/restore">,
) {
  return withAdmin(request, async () => {
    const { version } = await context.params;
    const versionNumber = Number(version);
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      throw new InvalidRequestError("버전 번호가 올바르지 않습니다.");
    }
    const body = await readJson(request, RestoreRequestSchema);
    return json({ draft: restoreVersion({ version: versionNumber, revision: body.revision }) });
  });
}
