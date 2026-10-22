import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "../db/client";
import { getAdminUrl, getAuthSecret } from "../env";
import { type Auth, createAuth } from "./config";

const globalState = globalThis as typeof globalThis & { __resumeAuth?: Auth };

/** 요청 처리 시점에 인증 인스턴스를 만든다. 빌드 중에는 DB를 열지 않는다. */
export function getAuth(): Auth {
  globalState.__resumeAuth ??= createAuth({
    db: getDb(),
    secret: getAuthSecret(),
    baseURL: getAdminUrl(),
  });
  return globalState.__resumeAuth;
}

export async function getSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

/**
 * 보호된 페이지에서 세션을 검증한다. 로그인하지 않았으면 로그인 화면으로 보낸다.
 * proxy의 쿠키 확인은 빠른 리다이렉트일 뿐이므로, 보호가 필요한 곳에서는 반드시 이 함수를 호출한다.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
