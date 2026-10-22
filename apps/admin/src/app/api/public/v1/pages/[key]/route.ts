import {
  type ApiErrorResponse,
  PublicPageResponseSchema,
  SystemPageKeySchema,
} from "@resume/contracts";
import { createSamplePageResponse } from "@resume/contracts/samples";

/*
 * 공개 콘텐츠 읽기 API (v1) — 샘플 응답.
 * 저장소에 포함된 샘플 데이터를 계약 스키마로 검증해 돌려준다.
 * DB와 게시 흐름이 정해지면 "게시된 버전"을 읽도록 교체한다. 지금 응답 구조는 최종 저장 구조가 아니다.
 */

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

function error(status: number, body: ApiErrorResponse) {
  return Response.json(body, { status, headers });
}

export async function GET(_request: Request, context: RouteContext<"/api/public/v1/pages/[key]">) {
  const { key } = await context.params;
  const parsedKey = SystemPageKeySchema.safeParse(key);
  if (!parsedKey.success) {
    return error(404, {
      error: { code: "not_found", message: `페이지를 찾을 수 없습니다: ${key}` },
    });
  }

  const sample = createSamplePageResponse(parsedKey.data);
  const parsed = PublicPageResponseSchema.safeParse(sample);
  if (!parsed.success) {
    console.error("[api] 샘플 응답이 계약과 다릅니다", parsed.error.issues);
    return error(500, { error: { code: "internal_error", message: "응답을 만들지 못했습니다." } });
  }
  return Response.json(parsed.data, { headers });
}
