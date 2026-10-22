"use client";

import {
  ApiErrorResponseSchema,
  adminApiPaths,
  DraftResponseSchema,
  type DraftState,
  PublishResponseSchema,
  type SiteDocument,
  VersionListResponseSchema,
} from "@resume/contracts";
import type { z } from "zod";

/** 관리자 API 오류. code는 서버가 보낸 오류 종류 */
export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T extends z.ZodType>(
  path: string,
  schema: T,
  init?: RequestInit,
): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", accept: "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError(0, "network", "서버에 연결하지 못했습니다. 네트워크를 확인하세요.");
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiErrorResponseSchema.safeParse(body);
    throw new AdminApiError(
      res.status,
      parsed.success ? parsed.data.error.code : "unknown",
      parsed.success ? parsed.data.error.message : `요청이 실패했습니다 (HTTP ${res.status}).`,
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new AdminApiError(res.status, "invalid_response", "서버 응답 형식이 올바르지 않습니다.");
  return parsed.data;
}

export const adminApi = {
  getDraft: async (): Promise<DraftState> =>
    (await call(adminApiPaths.draft, DraftResponseSchema)).draft,
  saveDraft: async (revision: number, document: SiteDocument): Promise<DraftState> =>
    (
      await call(adminApiPaths.draft, DraftResponseSchema, {
        method: "PUT",
        body: JSON.stringify({ revision, document }),
      })
    ).draft,
  publish: (revision: number, note: string) =>
    call(adminApiPaths.publish, PublishResponseSchema, {
      method: "POST",
      body: JSON.stringify({ revision, note: note.trim() || undefined }),
    }),
  listVersions: async () =>
    (await call(adminApiPaths.versions, VersionListResponseSchema)).versions,
  restore: async (version: number, revision: number): Promise<DraftState> =>
    (
      await call(adminApiPaths.restore(version), DraftResponseSchema, {
        method: "POST",
        body: JSON.stringify({ revision }),
      })
    ).draft,
};
