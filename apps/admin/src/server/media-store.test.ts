import { MEDIA_MAX_WIDTH, MEDIA_WIDTHS } from "@resume/contracts";
import { describe, expect, it } from "vitest";
import { targetWidths } from "./media-store";

describe("targetWidths", () => {
  it("never upscales: a small image gets only its own width", () => {
    expect(targetWidths(320)).toEqual([320]);
  });

  it("includes every preset below the original plus the original itself", () => {
    expect(targetWidths(1200)).toEqual([480, 960, 1200]);
  });

  it("does not duplicate a width that equals a preset", () => {
    expect(targetWidths(960)).toEqual([480, 960]);
  });

  it("caps at MEDIA_MAX_WIDTH for very large originals", () => {
    const widths = targetWidths(10_000);
    expect(widths.at(-1)).toBe(MEDIA_MAX_WIDTH);
    expect(widths).toEqual([...MEDIA_WIDTHS]);
  });

  it("returns ascending widths", () => {
    for (const w of [100, 481, 1601, 2559, 2561]) {
      const widths = targetWidths(w);
      expect(widths).toEqual([...widths].sort((a, b) => a - b));
    }
  });
});
