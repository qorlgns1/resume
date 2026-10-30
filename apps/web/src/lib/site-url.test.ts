import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { readSiteUrl, siteUrlFromHeaders } = await import("./site-url");

const env = (e: Record<string, string>) => e as NodeJS.ProcessEnv;

describe("readSiteUrl", () => {
  it("returns null when SITE_URL is unset or blank", () => {
    expect(readSiteUrl(env({}))).toBeNull();
    expect(readSiteUrl(env({ SITE_URL: "  " }))).toBeNull();
  });

  it("normalizes to the origin, dropping paths and trailing slashes", () => {
    expect(readSiteUrl(env({ SITE_URL: "https://example.com/" }))).toBe("https://example.com");
    expect(readSiteUrl(env({ SITE_URL: "https://example.com/some/path?x=1" }))).toBe(
      "https://example.com",
    );
    expect(readSiteUrl(env({ SITE_URL: "http://localhost:3200" }))).toBe("http://localhost:3200");
  });

  it("rejects non-http(s) or malformed values", () => {
    expect(readSiteUrl(env({ SITE_URL: "ftp://example.com" }))).toBeNull();
    expect(readSiteUrl(env({ SITE_URL: "example.com" }))).toBeNull();
    expect(readSiteUrl(env({ SITE_URL: "not a url" }))).toBeNull();
  });
});

describe("siteUrlFromHeaders", () => {
  const from = (h: Record<string, string>) => siteUrlFromHeaders((name) => h[name] ?? null);

  it("uses X-Forwarded-Host and X-Forwarded-Proto from a reverse proxy", () => {
    expect(
      from({
        host: "resume-web:3000",
        "x-forwarded-host": "example.com",
        "x-forwarded-proto": "https",
      }),
    ).toBe("https://example.com");
  });

  it("takes the first value when the proxy chain appended several", () => {
    expect(
      from({ "x-forwarded-host": "example.com, inner", "x-forwarded-proto": "https, http" }),
    ).toBe("https://example.com");
  });

  it("assumes https for a public host and http for localhost when no proto is given", () => {
    expect(from({ host: "example.com" })).toBe("https://example.com");
    expect(from({ host: "localhost:3200" })).toBe("http://localhost:3200");
    expect(from({ host: "127.0.0.1:3100" })).toBe("http://127.0.0.1:3100");
  });

  it("ignores an invalid forwarded proto", () => {
    expect(from({ host: "example.com", "x-forwarded-proto": "ws" })).toBe("https://example.com");
  });

  it("returns null without a host", () => {
    expect(from({})).toBeNull();
  });
});
