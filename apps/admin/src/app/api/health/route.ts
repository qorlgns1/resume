import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

/** 프로세스와 DB(마이그레이션 포함)가 준비되었는지 확인한다. */
export function GET() {
  try {
    getDb().run(sql`select 1`);
    return Response.json({ status: "ok" }, { headers });
  } catch (cause) {
    console.error("[health] DB를 사용할 수 없습니다", cause);
    return Response.json({ status: "error" }, { status: 503, headers });
  }
}
