import { describe, expect, it } from "vitest";
import {
  createPageResponse,
  PublicPageResponseSchema,
  SiteDocumentSchema,
  SystemPageKeySchema,
} from "./index";
import { createSamplePageResponse, sampleSiteDocument } from "./samples";

const document = SiteDocumentSchema.parse(sampleSiteDocument);
const meta = { source: "published" as const, version: 3, generatedAt: new Date().toISOString() };

describe("sampleSiteDocument", () => {
  it("passes the SiteDocument contract", () => {
    const result = SiteDocumentSchema.safeParse(sampleSiteDocument);
    expect(result.success, result.success ? "" : result.error.message).toBe(true);
  });

  it("has every system page after parsing", () => {
    const keys = document.pages.flatMap((p) => (p.kind === "system" ? [p.systemKey] : []));
    expect(keys.sort()).toEqual([...SystemPageKeySchema.options].sort());
  });
});

describe("createPageResponse", () => {
  it.each(SystemPageKeySchema.options)(
    "builds a response for %s that passes the contract",
    (key) => {
      const body = createPageResponse(document, key, meta);
      expect(body).not.toBeNull();
      const parsed = PublicPageResponseSchema.safeParse(body);
      expect(parsed.success, parsed.success ? "" : parsed.error.message).toBe(true);
      expect(body?.data.page.kind).toBe("system");
      expect(body?.data.page.kind === "system" && body.data.page.systemKey).toBe(key);
      expect(body?.meta).toEqual(meta);
    },
  );

  it("returns null when the document has no page for the key", () => {
    const withoutHistory = {
      ...document,
      pages: document.pages.filter((p) => !(p.kind === "system" && p.systemKey === "history")),
    };
    expect(createPageResponse(withoutHistory, "history", meta)).toBeNull();
    expect(createPageResponse(withoutHistory, "home", meta)).not.toBeNull();
  });

  it("rejects a response whose page references content that is missing", () => {
    const body = createPageResponse(document, "home", meta);
    if (!body) throw new Error("home page missing");
    const broken = {
      ...body,
      data: { ...body.data, content: { ...body.data.content, projects: [] } },
    };
    expect(PublicPageResponseSchema.safeParse(broken).success).toBe(false);
  });
});

describe("createSamplePageResponse", () => {
  it("marks the response as sample without a version", () => {
    const body = createSamplePageResponse("home", new Date("2026-01-02T03:04:05.000Z"));
    expect(body?.meta).toEqual({ source: "sample", generatedAt: "2026-01-02T03:04:05.000Z" });
    expect(PublicPageResponseSchema.safeParse(body).success).toBe(true);
  });
});
