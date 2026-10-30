import { createSamplePageResponse } from "@resume/contracts/samples";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * getPublicPage는 요청 컨텍스트 밖에서도 돌 수 있게 Next의 connection()을 비우고,
 * 어드민 API는 전역 fetch를 바꿔치기해 흉내 낸다. 실패 종류를 구분해 돌려주는지 확인한다.
 */

vi.mock("next/server", () => ({ connection: async () => {} }));

const { getPublicPage } = await import("./get-page");

const apiEnv = { CONTENT_SOURCE: "api", CONTENT_API_URL: "http://admin:3001" };
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function setEnv(env: Record<string, string>) {
  for (const key of ["CONTENT_SOURCE", "CONTENT_API_URL", "CONTENT_API_TIMEOUT_MS"]) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
}

function mockFetch(impl: (url: string) => Promise<Response>) {
  const spy = vi.fn((input: string | URL | Request) => impl(String(input)));
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("getPublicPage (sample mode)", () => {
  it("returns the validated sample response without touching the network", async () => {
    setEnv({ CONTENT_SOURCE: "sample" });
    const spy = mockFetch(() => Promise.reject(new Error("must not be called")));
    const result = await getPublicPage("home");
    expect(spy).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("sample");
      expect(result.response.meta.source).toBe("sample");
    }
  });

  it("reports a config error for an invalid CONTENT_SOURCE", async () => {
    setEnv({ CONTENT_SOURCE: "nope" });
    const result = await getPublicPage("home");
    expect(result).toMatchObject({ ok: false, mode: "unknown", error: { kind: "config" } });
  });
});

describe("getPublicPage (api mode)", () => {
  it("calls the admin page endpoint and returns the validated response", async () => {
    setEnv(apiEnv);
    const body = createSamplePageResponse("projects");
    const spy = mockFetch(async () => Response.json(body));
    const result = await getPublicPage("projects");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toBe("http://admin:3001/api/public/v1/pages/projects");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.response.data.page.id).toBe(body?.data.page.id);
  });

  it("distinguishes a network failure", async () => {
    setEnv(apiEnv);
    mockFetch(() => Promise.reject(new TypeError("fetch failed")));
    const result = await getPublicPage("home");
    expect(result).toMatchObject({ ok: false, mode: "api", error: { kind: "network" } });
  });

  it("distinguishes a timeout", async () => {
    setEnv({ ...apiEnv, CONTENT_API_TIMEOUT_MS: "1500" });
    mockFetch(() => Promise.reject(new DOMException("timed out", "TimeoutError")));
    const result = await getPublicPage("home");
    expect(result).toMatchObject({ ok: false, mode: "api", error: { kind: "timeout" } });
    if (!result.ok) expect(result.error.message).toContain("1500ms");
  });

  it("maps 404 to not-found and other HTTP errors to http", async () => {
    setEnv(apiEnv);
    mockFetch(async () => new Response("", { status: 404 }));
    expect(await getPublicPage("home")).toMatchObject({ ok: false, error: { kind: "not-found" } });

    mockFetch(async () => new Response("boom", { status: 500 }));
    const result = await getPublicPage("history");
    expect(result).toMatchObject({ ok: false, error: { kind: "http" } });
    if (!result.ok) expect(result.error.message).toContain("500");
  });

  it("rejects a response that is not JSON or does not match the contract", async () => {
    setEnv(apiEnv);
    mockFetch(async () => new Response("<html>", { status: 200 }));
    expect(await getPublicPage("home")).toMatchObject({
      ok: false,
      error: { kind: "invalid-response" },
    });

    mockFetch(async () => Response.json({ schemaVersion: 1, data: {}, meta: {} }));
    expect(await getPublicPage("about")).toMatchObject({
      ok: false,
      error: { kind: "invalid-response" },
    });
  });
});
