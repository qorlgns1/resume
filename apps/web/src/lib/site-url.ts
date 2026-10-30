import "server-only";
import { headers } from "next/headers";

/*
 * 공개 사이트의 절대 주소. sitemap, robots, 공유 미리보기(Open Graph)의 절대 URL에 쓴다.
 * SITE_URL 환경 변수를 우선하고, 없으면 요청 헤더(리버스 프록시가 넘긴 Host·X-Forwarded-Proto)로 만든다.
 */

/** SITE_URL 환경 변수를 origin 형태로 정규화한다. 없거나 http(s) 주소가 아니면 null */
export function readSiteUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const raw = env.SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** 요청 헤더로 만든 origin. 프록시가 없으면 Host만으로 만들고, localhost는 http로 본다. */
export function siteUrlFromHeaders(get: (name: string) => string | null): string | null {
  const host = get("x-forwarded-host")?.split(",")[0]?.trim() || get("host")?.trim();
  if (!host) return null;
  const forwardedProto = get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : isLocal
        ? "http"
        : "https";
  return `${proto}://${host}`;
}

/** 현재 요청 기준 사이트 주소. 알 수 없으면 null (상대 주소만 쓴다) */
export async function resolveSiteUrl(): Promise<string | null> {
  const fromEnv = readSiteUrl();
  if (fromEnv) return fromEnv;
  const h = await headers();
  return siteUrlFromHeaders((name) => h.get(name));
}
