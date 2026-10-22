import { json, withAdmin } from "@/server/admin-api";
import { listVersions } from "@/server/site-repository";

export const dynamic = "force-dynamic";

/** 게시 버전 목록 (최신순) */
export function GET(request: Request) {
  return withAdmin(request, () => json({ versions: listVersions() }));
}
