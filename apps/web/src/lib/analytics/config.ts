import "server-only";

export interface AnalyticsConfig {
  /** PostHog 프로젝트 키 (phc_...). 브라우저에 공개되는 값이다. */
  key: string;
  host: string;
}

/**
 * 방문 분석 설정. POSTHOG_KEY가 없으면 null이고 추적 스크립트를 싣지 않는다.
 * 요청 시점에 읽으므로 키를 바꿀 때 다시 빌드하지 않아도 된다.
 */
export function readAnalyticsConfig(env: NodeJS.ProcessEnv = process.env): AnalyticsConfig | null {
  const key = env.POSTHOG_KEY?.trim();
  if (!key) return null;
  return { key, host: env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com" };
}
