import "server-only";
import { type ApiErrorResponse, configureKoreanErrors } from "@resume/contracts";
import { ZodError, type z } from "zod";
import { getAuth } from "./auth";
import { getAdminUrl } from "./env";
import { MediaInUseError, MediaNotFoundError, MediaRejectedError } from "./media-store";
import {
  ConflictError,
  NothingToPublishError,
  StoredDocumentError,
  VersionNotFoundError,
} from "./site-repository";

/*
 * 관리자 API(/api/admin/*) 공통 처리.
 * - 로그인 세션을 DB에서 검증한다 (proxy는 API를 거치지 않는다).
 * - 변경 요청(GET 외)은 Origin이 어드민 주소와 같아야 한다. 다른 사이트가 로그인 쿠키를 이용해 요청하는 것(CSRF)을 막는다.
 * - 저장소 오류를 일정한 JSON 오류 형식으로 바꾼다.
 */

configureKoreanErrors();

const headers = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers });
}

function error(status: number, code: ApiErrorResponse["error"]["code"], message: string) {
  return json({ error: { code, message } } satisfies ApiErrorResponse, status);
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(getAdminUrl()).origin;
}

export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new InvalidRequestError("JSON 본문이 필요합니다.");
  }
  return schema.parse(body);
}

export class InvalidRequestError extends Error {}

export async function withAdmin(request: Request, handler: () => Response | Promise<Response>) {
  if (request.method !== "GET" && !isAllowedOrigin(request)) {
    return error(403, "forbidden", "허용되지 않은 출처에서 온 요청입니다.");
  }
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return error(401, "unauthorized", "로그인이 필요합니다.");

  try {
    return await handler();
  } catch (cause) {
    if (cause instanceof ConflictError) return error(409, "conflict", cause.message);
    if (cause instanceof NothingToPublishError)
      return error(422, "nothing_to_publish", cause.message);
    if (cause instanceof VersionNotFoundError) return error(404, "not_found", cause.message);
    if (cause instanceof MediaRejectedError) {
      return error(cause.code === "too_large" ? 413 : 400, cause.code, cause.message);
    }
    if (cause instanceof MediaInUseError) return error(409, "in_use", cause.message);
    if (cause instanceof MediaNotFoundError)
      return error(404, "not_found", "이미지를 찾을 수 없습니다.");
    if (cause instanceof InvalidRequestError) return error(400, "invalid_request", cause.message);
    if (cause instanceof ZodError) {
      const message = cause.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".") || "(본문)"}: ${issue.message}`)
        .join("\n");
      return error(400, "invalid_request", message);
    }
    if (cause instanceof StoredDocumentError) console.error("[admin-api] 저장된 문서 오류", cause);
    else console.error("[admin-api] 처리하지 못한 오류", cause);
    return error(500, "internal_error", "요청을 처리하지 못했습니다.");
  }
}
