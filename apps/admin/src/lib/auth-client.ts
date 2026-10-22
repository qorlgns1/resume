"use client";

import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** 브라우저용 인증 클라이언트. 로그인 요청이 /api/auth를 거쳐야 시도 제한이 적용된다. */
export const authClient = createAuthClient({ plugins: [usernameClient()] });
