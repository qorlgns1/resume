import { type SiteDocument, SiteDocumentSchema } from "@resume/contracts";
import { sampleSiteDocument } from "@resume/contracts/samples";
import { describe, expect, it } from "vitest";
import {
  createContentItem,
  currentYearMonth,
  findContentUsages,
  newHistoryChapter,
  uniqueSlug,
} from "./content-model";

const document = SiteDocumentSchema.parse(sampleSiteDocument);

describe("uniqueSlug", () => {
  it("keeps the base when it is free and appends -2, -3 when taken", () => {
    expect(uniqueSlug("app", [])).toBe("app");
    expect(uniqueSlug("app", ["app"])).toBe("app-2");
    expect(uniqueSlug("app", ["app", "app-2"])).toBe("app-3");
  });
});

describe("currentYearMonth", () => {
  it("formats as YYYY-MM with a zero-padded month", () => {
    expect(currentYearMonth(new Date(2026, 0, 15))).toBe("2026-01");
    expect(currentYearMonth(new Date(2026, 11, 1))).toBe("2026-12");
    expect(currentYearMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("createContentItem", () => {
  it("creates a project whose slug does not collide with existing ones", () => {
    const taken = {
      ...document,
      content: {
        ...document.content,
        projects: [{ ...document.content.projects[0], slug: "new-project" }],
      },
    } as SiteDocument;
    const { id, item } = createContentItem("projects", taken);
    expect(id).toMatch(/^prj/);
    expect(item).toMatchObject({ id, slug: "new-project-2", kind: "personal", body: [] });
  });

  it("creates each kind with a matching id prefix and a valid shape", () => {
    expect(createContentItem("companies", document).item).toMatchObject({
      slug: "new-company",
      period: { start: expect.stringMatching(/^\d{4}-\d{2}$/), end: null },
    });
    expect(createContentItem("achievements", document).id).toMatch(/^ach/);
    expect(createContentItem("techStack", document).item).toMatchObject({ items: ["기술"] });
  });

  it("produces items that still pass the document contract once inserted", () => {
    const next = structuredClone(document) as SiteDocument;
    for (const section of ["projects", "companies", "achievements", "techStack"] as const) {
      (next.content[section] as unknown[]).push(createContentItem(section, next).item);
    }
    expect(SiteDocumentSchema.safeParse(next).success).toBe(true);
  });
});

describe("findContentUsages", () => {
  it("lists the modules that reference a project", () => {
    const project = document.content.projects[0];
    if (!project) throw new Error("sample needs a project");
    const usages = findContentUsages(document, "projects", project.id);
    expect(usages.some((u) => u.includes("모듈"))).toBe(true);
  });

  it("lists achievements and history entries that point at a company", () => {
    const company = document.content.companies[0];
    if (!company) throw new Error("sample needs a company");
    const doc = structuredClone(document) as SiteDocument;
    doc.content.achievements[0] = {
      ...doc.content.achievements[0],
      companyId: company.id,
    } as never;
    const chapter = doc.content.history.chapters[0];
    if (!chapter?.entries[0]) throw new Error("sample needs a history entry");
    chapter.entries[0].ref = { kind: "company", id: company.id };

    const usages = findContentUsages(doc, "companies", company.id);
    expect(usages.some((u) => u.startsWith("성과"))).toBe(true);
    expect(usages.some((u) => u.startsWith("히스토리"))).toBe(true);
  });

  it("returns nothing for an id that is not used anywhere", () => {
    expect(findContentUsages(document, "techStack", "ts_missing")).toEqual([]);
  });
});

describe("newHistoryChapter", () => {
  it("starts this month with no entries", () => {
    const chapter = newHistoryChapter();
    expect(chapter.id).toMatch(/^ch/);
    expect(chapter.period).toEqual({ start: currentYearMonth(), end: null });
    expect(chapter.entries).toEqual([]);
  });
});
