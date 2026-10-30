import { describe, expect, it } from "vitest";
import { BlockSchema, MAX_LIST_DEPTH, MAX_TABLE_COLUMNS, SiteDocumentSchema } from "./index";
import { sampleSiteDocument } from "./samples";

const text = (t: string) => [{ text: t }];

describe("BlockSchema", () => {
  it("accepts a list nested up to MAX_LIST_DEPTH", () => {
    const nested = {
      text: text("1"),
      children: [{ text: text("2"), children: [{ text: text("3") }] }],
    };
    expect(MAX_LIST_DEPTH).toBe(3);
    expect(
      BlockSchema.safeParse({ id: "b1", type: "bulleted-list", items: [nested] }).success,
    ).toBe(true);
  });

  it("rejects a list nested deeper than MAX_LIST_DEPTH", () => {
    const tooDeep = {
      text: text("1"),
      children: [
        { text: text("2"), children: [{ text: text("3"), children: [{ text: text("4") }] }] },
      ],
    };
    const result = BlockSchema.safeParse({ id: "b1", type: "bulleted-list", items: [tooDeep] });
    expect(result.success).toBe(false);
  });

  it("reads the legacy list item shape (bare RichText array) as { text }", () => {
    const result = BlockSchema.safeParse({ id: "b1", type: "bulleted-list", items: [text("old")] });
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "bulleted-list") {
      expect(result.data.items).toEqual([{ text: text("old") }]);
    }
  });

  it("requires every table row to have the same number of cells", () => {
    const ragged = {
      id: "t1",
      type: "table",
      headerRow: true,
      rows: [[text("a"), text("b")], [text("c")]],
    };
    expect(BlockSchema.safeParse(ragged).success).toBe(false);
    const even = {
      ...ragged,
      rows: [
        [text("a"), text("b")],
        [text("c"), text("d")],
      ],
    };
    expect(BlockSchema.safeParse(even).success).toBe(true);
  });

  it("caps table width at MAX_TABLE_COLUMNS", () => {
    const row = Array.from({ length: MAX_TABLE_COLUMNS + 1 }, (_, i) => text(String(i)));
    expect(
      BlockSchema.safeParse({ id: "t1", type: "table", headerRow: false, rows: [row] }).success,
    ).toBe(false);
  });

  it("rejects links that are not http(s), mailto, tel, or in-page", () => {
    const paragraph = (href: string) => ({
      id: "p1",
      type: "paragraph",
      text: [{ text: "x", href }],
    });
    expect(BlockSchema.safeParse(paragraph("javascript:alert(1)")).success).toBe(false);
    expect(BlockSchema.safeParse(paragraph("https://example.com")).success).toBe(true);
  });
});

describe("SiteDocumentSchema", () => {
  it("adds the about page to documents saved before it existed", () => {
    const withoutAbout = {
      ...sampleSiteDocument,
      pages: sampleSiteDocument.pages.filter(
        (p) => !(p.kind === "system" && p.systemKey === "about"),
      ),
    };
    const parsed = SiteDocumentSchema.parse(withoutAbout);
    expect(parsed.pages.some((p) => p.kind === "system" && p.systemKey === "about")).toBe(true);
  });

  it("rejects duplicate project slugs", () => {
    const [first, ...rest] = sampleSiteDocument.content.projects;
    if (!first || !rest[0]) throw new Error("sample needs at least two projects");
    const doc = {
      ...sampleSiteDocument,
      content: {
        ...sampleSiteDocument.content,
        projects: [first, { ...rest[0], slug: first.slug }, ...rest.slice(1)],
      },
    };
    const result = SiteDocumentSchema.safeParse(doc);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("slug"))).toBe(true);
    }
  });

  it("rejects a history entry that points at a missing company", () => {
    const chapters = sampleSiteDocument.content.history.chapters.map((chapter, ci) => ({
      ...chapter,
      entries: chapter.entries.map((entry, ei) =>
        ci === 0 && ei === 0
          ? { ...entry, ref: { kind: "company" as const, id: "co_missing" } }
          : entry,
      ),
    }));
    const doc = {
      ...sampleSiteDocument,
      content: {
        ...sampleSiteDocument.content,
        history: { ...sampleSiteDocument.content.history, chapters },
      },
    };
    expect(SiteDocumentSchema.safeParse(doc).success).toBe(false);
  });
});
