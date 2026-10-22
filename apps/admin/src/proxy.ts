import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * 로그인 쿠키가 없으면 로그인 화면으로 보낸다.
 * 쿠키 존재만 보는 빠른 확인이며, 실제 세션 검증은 각 페이지·API의 requireSession이 한다.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // 로그인 화면, 인증 API, 공개 API, 헬스 체크, 정적 파일은 제외한다.
  matcher: ["/((?!login|api/auth|api/public|api/health|_next/|favicon.ico|robots.txt).*)"],
};
