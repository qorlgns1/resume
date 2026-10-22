import {
  type ApiErrorResponse,
  createPageResponse,
  PublicPageResponseSchema,
  SystemPageKeySchema,
} from "@resume/contracts";
import { getLatestPublished } from "@/server/site-repository";

/*
 * 공개 콘텐츠 읽기 API (v1).
 * 가장 최근에 게시된 버전을 돌려준다. 초안은 절대 노출하지 않는다.
 * 인증이 필요 없으며, 공개 사이트 서버가 호출한다.
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

  let published: ReturnType<typeof getLatestPublished>;
  try {
    published = getLatestPublished();
  } catch (cause) {
    console.error("[api] 게시본을 읽지 못했습니다", cause);
    return error(500, { error: { code: "internal_error", message: "콘텐츠를 읽지 못했습니다." } });
  }
  if (!published) {
    return error(404, { error: { code: "not_found", message: "아직 게시된 버전이 없습니다." } });
  }

  const body = createPageResponse(published.document, parsedKey.data, {
    source: "published",
    version: published.version,
    generatedAt: new Date().toISOString(),
  });
  if (!body) {
    return error(404, {
      error: { code: "not_found", message: `페이지를 찾을 수 없습니다: ${key}` },
    });
  }

  const parsed = PublicPageResponseSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[api] 응답이 계약과 다릅니다", parsed.error.issues);
    return error(500, { error: { code: "internal_error", message: "응답을 만들지 못했습니다." } });
  }
  return Response.json(parsed.data, { headers });
}
