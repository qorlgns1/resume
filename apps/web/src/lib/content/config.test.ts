import { describe, expect, it } from "vitest";
import { ContentConfigError, readContentSourceConfig as read } from "./config";

/** 테스트용 환경 변수 묶음을 ProcessEnv로 넘긴다. */
const readContentSourceConfig = (env: Record<string, string>) => read(env as NodeJS.ProcessEnv);

describe("readContentSourceConfig", () => {
  it("defaults to sample mode when CONTENT_SOURCE is unset or blank", () => {
    expect(readContentSourceConfig({})).toEqual({ mode: "sample" });
    expect(readContentSourceConfig({ CONTENT_SOURCE: "  " })).toEqual({ mode: "sample" });
  });

  it("rejects an unknown mode instead of silently falling back", () => {
    expect(() => readContentSourceConfig({ CONTENT_SOURCE: "db" })).toThrow(ContentConfigError);
  });

  it("requires a valid http(s) CONTENT_API_URL in api mode", () => {
    expect(() => readContentSourceConfig({ CONTENT_SOURCE: "api" })).toThrow(ContentConfigError);
    expect(() =>
      readContentSourceConfig({ CONTENT_SOURCE: "api", CONTENT_API_URL: "not a url" }),
    ).toThrow(ContentConfigError);
    expect(() =>
      readContentSourceConfig({ CONTENT_SOURCE: "api", CONTENT_API_URL: "ftp://admin:3001" }),
    ).toThrow(ContentConfigError);
  });

  it("normalizes the base URL and applies the timeout default", () => {
    expect(
      readContentSourceConfig({ CONTENT_SOURCE: "api", CONTENT_API_URL: "http://admin:3001/" }),
    ).toEqual({ mode: "api", baseUrl: "http://admin:3001", timeoutMs: 5000 });
  });

  it("falls back to the default timeout for invalid values", () => {
    const base = { CONTENT_SOURCE: "api", CONTENT_API_URL: "http://admin:3001" };
    expect(
      readContentSourceConfig({ ...base, CONTENT_API_TIMEOUT_MS: "1500" }).mode === "api",
    ).toBe(true);
    expect(readContentSourceConfig({ ...base, CONTENT_API_TIMEOUT_MS: "1500" })).toMatchObject({
      timeoutMs: 1500,
    });
    expect(readContentSourceConfig({ ...base, CONTENT_API_TIMEOUT_MS: "abc" })).toMatchObject({
      timeoutMs: 5000,
    });
    expect(readContentSourceConfig({ ...base, CONTENT_API_TIMEOUT_MS: "-1" })).toMatchObject({
      timeoutMs: 5000,
    });
  });
});
