import { describe, expect, it } from "vitest";
import { formatSpeakingTime, speakingSeconds, spokenLength } from "./speaking-time";

describe("speaking time", () => {
  it("counts letters and digits, not spaces or punctuation", () => {
    expect(spokenLength("안녕하세요, 배기훈입니다.")).toBe(11);
    expect(spokenLength("LCP 3.09초")).toBe(7);
  });

  it("rounds to 5 seconds and never shows 0 for non-empty text", () => {
    expect(speakingSeconds("")).toBe(0);
    expect(speakingSeconds("네")).toBe(5);
    // 270자 = 60초
    expect(speakingSeconds("가".repeat(270))).toBe(60);
  });

  it("formats seconds and minutes", () => {
    expect(formatSpeakingTime("")).toBeNull();
    expect(formatSpeakingTime("가".repeat(135))).toBe("약 30초");
    expect(formatSpeakingTime("가".repeat(270))).toBe("약 1분");
    expect(formatSpeakingTime("가".repeat(315))).toBe("약 1분 10초");
  });
});
