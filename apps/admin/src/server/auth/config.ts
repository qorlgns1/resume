import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import type { AppDatabase } from "../db/open";
import * as schema from "../db/schema";

export const MIN_PASSWORD_LENGTH = 10;

/** 로그인 시도 제한: 같은 IP에서 1분에 5번까지 */
export const SIGN_IN_RATE_LIMIT = { window: 60, max: 5 } as const;

interface AuthConfigInput {
  db: AppDatabase;
  secret: string;
  baseURL: string;
}

/**
 * Better Auth 설정. 서버 요청 처리와 CLI가 같은 설정을 공유한다.
 * - 관리자 1명, 아이디 + 비밀번호
 * - 웹 가입은 막는다. 계정은 서버 CLI(admin:create)로만 만든다.
 */
export function createAuth({ db, secret, baseURL }: AuthConfigInput) {
  return betterAuth({
    appName: "Resume Admin",
    secret,
    baseURL,
    trustedOrigins: [baseURL],
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7일
      updateAge: 60 * 60 * 24, // 하루에 한 번 만료 연장
    },
    rateLimit: {
      customRules: {
        "/sign-in/username": SIGN_IN_RATE_LIMIT,
        "/sign-in/email": SIGN_IN_RATE_LIMIT,
      },
    },
    // 가입·아이디 조회 등 쓰지 않는 경로는 닫는다.
    disabledPaths: ["/sign-up/email", "/is-username-available"],
    telemetry: { enabled: false },
    plugins: [username(), nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
