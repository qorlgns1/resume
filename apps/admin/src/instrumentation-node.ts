import { getDb } from "./server/db/client";
import { getAdminUrl, getAuthSecret } from "./server/env";
import { seedIfEmpty } from "./server/site-repository";

/*
 * 필수 설정을 확인하고 DB 마이그레이션과 첫 데이터 생성을 미리 끝낸다.
 * Next는 시작 단계의 오류로 서버를 멈추지 않으므로, 잘못된 설정으로 계속 떠 있지 않도록 직접 종료한다.
 */
try {
  getAuthSecret();
  getAdminUrl();
  if (seedIfEmpty(getDb())) {
    console.info("[admin] 빈 DB를 샘플 콘텐츠로 채웠습니다 (초안 + 게시 버전 1).");
  }
} catch (error) {
  console.error(
    `[admin] 시작하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
