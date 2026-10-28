"use client";

import { useEffect } from "react";
import type { AnalyticsConfig } from "@/lib/analytics/config";

/**
 * PostHog 방문 분석. 설정이 있을 때만 렌더링되고, 스크립트도 그때만 불러온다.
 * 페이지 이동과 클릭을 자동으로 기록한다. 세션 녹화·히트맵은 PostHog 프로젝트 설정에서 켠다.
 */
export function Analytics({ config }: { config: AnalyticsConfig }) {
  useEffect(() => {
    import("posthog-js").then(({ default: posthog }) => {
      if (posthog.__loaded) return;
      posthog.init(config.key, {
        api_host: config.host,
        defaults: "2026-08-30",
        // 재방문자를 알아보기 위한 방문자 ID를 localStorage에 둔다. 쿠키는 쓰지 않는다.
        persistence: "localStorage",
        // ?ph_internal=1로 한 번 열면 이 브라우저의 모든 이벤트에 internal_visit가 붙는다.
        // PostHog 프로젝트의 테스트 계정 필터가 이 값으로 내 방문을 뺀다.
        loaded: (instance) => {
          if (new URLSearchParams(window.location.search).has("ph_internal")) {
            instance.register({ internal_visit: true });
          }
        },
      });
    });
  }, [config]);

  return null;
}
