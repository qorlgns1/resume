import "server-only";

export type ContentSourceConfig =
  | { mode: "sample" }
  | { mode: "api"; baseUrl: string; timeoutMs: number };

export class ContentConfigError extends Error {}

/**
 * 콘텐츠 출처 설정. 요청 시점에 환경 변수를 읽으므로
 * 같은 빌드 결과(Docker 이미지 등)를 sample/api 어느 쪽으로도 실행할 수 있다.
 */
export function readContentSourceConfig(env: NodeJS.ProcessEnv = process.env): ContentSourceConfig {
  const mode = env.CONTENT_SOURCE?.trim() || "sample";
  if (mode === "sample") return { mode };
  if (mode !== "api") {
    throw new ContentConfigError(
      `CONTENT_SOURCE는 "sample" 또는 "api"여야 합니다. (현재: "${mode}")`,
    );
  }

  const rawUrl = env.CONTENT_API_URL?.trim();
  if (!rawUrl) {
    throw new ContentConfigError("CONTENT_SOURCE=api에는 CONTENT_API_URL이 필요합니다.");
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    throw new ContentConfigError(`CONTENT_API_URL이 올바른 URL이 아닙니다. (현재: "${rawUrl}")`);
  }
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new ContentConfigError("CONTENT_API_URL은 http(s) 주소여야 합니다.");
  }

  const timeoutMs = Number(env.CONTENT_API_TIMEOUT_MS ?? 5000);
  return {
    mode,
    baseUrl: baseUrl.toString().replace(/\/$/, ""),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000,
  };
}
