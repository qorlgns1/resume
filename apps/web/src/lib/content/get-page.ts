import "server-only";
import {
  type PublicPageResponse,
  PublicPageResponseSchema,
  publicApiPaths,
  type SystemPageKey,
} from "@resume/contracts";
import { createSamplePageResponse } from "@resume/contracts/samples";
import { connection } from "next/server";
import { cache } from "react";
import { ContentConfigError, readContentSourceConfig } from "./config";

export type ContentErrorKind =
  | "config"
  | "network"
  | "timeout"
  | "http"
  | "invalid-response"
  | "not-found";

export type PageResult =
  | { ok: true; mode: "sample" | "api"; response: PublicPageResponse }
  | {
      ok: false;
      mode: "sample" | "api" | "unknown";
      error: { kind: ContentErrorKind; message: string };
    };

/**
 * 공개 사이트의 유일한 콘텐츠 접근 지점.
 * - sample 모드: 저장소의 샘플 데이터를 계약 스키마로 검증해 반환한다.
 * - api 모드: 어드민 API를 서버에서 호출하고 응답을 검증한다.
 *   실패하면 샘플로 대체하지 않고 오류 결과를 반환한다.
 */
export const getPublicPage = cache(async (key: SystemPageKey): Promise<PageResult> => {
  // 요청 시점에 실행되도록 해서 빌드 단계가 어드민 API나 환경 변수에 의존하지 않게 한다.
  await connection();

  let config: ReturnType<typeof readContentSourceConfig>;
  try {
    config = readContentSourceConfig();
  } catch (error) {
    if (error instanceof ContentConfigError) {
      return { ok: false, mode: "unknown", error: { kind: "config", message: error.message } };
    }
    throw error;
  }

  if (config.mode === "sample") {
    const sample = createSamplePageResponse(key);
    if (!sample)
      return {
        ok: false,
        mode: "sample",
        error: { kind: "not-found", message: `샘플 페이지 없음: ${key}` },
      };
    const parsed = PublicPageResponseSchema.safeParse(sample);
    if (!parsed.success) {
      return {
        ok: false,
        mode: "sample",
        error: { kind: "invalid-response", message: parsed.error.message },
      };
    }
    return { ok: true, mode: "sample", response: parsed.data };
  }

  const url = `${config.baseUrl}${publicApiPaths.page(key)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    console.error(`[content] ${url} 요청 실패`, error);
    return {
      ok: false,
      mode: "api",
      error: timedOut
        ? {
            kind: "timeout",
            message: `콘텐츠 API가 ${config.timeoutMs}ms 안에 응답하지 않았습니다.`,
          }
        : { kind: "network", message: "콘텐츠 API에 연결할 수 없습니다." },
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      mode: "api",
      error: { kind: "not-found", message: `페이지를 찾을 수 없습니다: ${key}` },
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      mode: "api",
      error: { kind: "http", message: `콘텐츠 API 오류 (HTTP ${res.status})` },
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      ok: false,
      mode: "api",
      error: { kind: "invalid-response", message: "JSON 응답이 아닙니다." },
    };
  }
  const parsed = PublicPageResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(`[content] ${url} 응답이 계약과 다릅니다`, parsed.error.issues);
    return {
      ok: false,
      mode: "api",
      error: { kind: "invalid-response", message: "콘텐츠 API 응답이 계약과 다릅니다." },
    };
  }
  return { ok: true, mode: "api", response: parsed.data };
});
