import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
import { guidanceEntries, selectSkillGuidance } from "./skill-guidance";

const skills = ["READING", "LISTENING", "WRITING", "SPEAKING"];
const combinations = (levels) => levels.flatMap((targetLevel) => skills.flatMap((skillDimension) =>
  [false, true].map((passed) => ({ targetLevel, skillDimension, passed, locale: "vi" }))));

describe("Approved Vietnamese guidance catalog", () => {
  it("contains exactly the 24 approved, unique entries with unchanged editorial content", () => {
    // Fingerprint from the supplied entries, independent of checkout line endings.
    expect(createHash("sha256").update(JSON.stringify(guidanceEntries)).digest("hex"))
      .toBe("6b8fdbaa58c1e6bc4df1b699e0defce477f42c4fb7beb66433ae844cec805131");
    expect(guidanceEntries).toHaveLength(24);
    expect(new Set(guidanceEntries.map((entry) => entry.id)).size).toBe(24);
    expect(new Set(guidanceEntries.map(({ targetLevel, skillDimension, passed, locale }) =>
      JSON.stringify([targetLevel, skillDimension, passed, locale]))).size).toBe(24);
    const expected = combinations(["A1", "A2", null]);
    for (const input of expected) {
      const entry = guidanceEntries.find((candidate) => Object.entries(input)
        .every(([key, value]) => candidate[key] === value));
      expect(entry).toBeDefined();
      expect(entry.id).toBe(`${input.skillDimension.toLowerCase()}.${input.targetLevel?.toLowerCase() ?? "generic"}.${input.passed ? "passed" : "not_passed"}`);
      expect(entry.content.trim()).not.toBe("");
      expect(entry.content.split("\n\n").length).toBeGreaterThan(1);
    }
  });
});

describe("Pure official skill guidance selection", () => {
  it.each(combinations(["A1", "A2"]))("selects exact $targetLevel $skillDimension $passed guidance", (input) => {
    expect(selectSkillGuidance(input)).toMatchObject(input);
  });

  it.each(combinations(["A0", "B1", "B2", "C1", "C2"]))("uses generic guidance for $targetLevel $skillDimension $passed", (input) => {
    expect(selectSkillGuidance(input)).toMatchObject({ ...input, targetLevel: null });
  });

  it("prefers the exact entry even when generic content precedes it", () => {
    const input = { targetLevel: "A1", skillDimension: "READING", passed: true, locale: "vi" };
    expect(selectSkillGuidance(input, [...guidanceEntries].reverse())).toMatchObject(input);
  });

  it("falls back only to the same skill, outcome and locale, never another level", () => {
    const input = { targetLevel: "A1", skillDimension: "READING", passed: false, locale: "vi" };
    const withoutExact = guidanceEntries.filter((entry) => entry.id !== "reading.a1.not_passed");
    expect(selectSkillGuidance(input, withoutExact)?.id).toBe("reading.generic.not_passed");
    expect(selectSkillGuidance(input, withoutExact.filter((entry) => entry.id !== "reading.generic.not_passed"))).toBeNull();
    expect(selectSkillGuidance(input, guidanceEntries.filter((entry) => entry.skillDimension !== "READING"))).toBeNull();
    expect(selectSkillGuidance(input, guidanceEntries.filter((entry) => entry.passed))).toBeNull();
    expect(selectSkillGuidance(input, guidanceEntries.map((entry) => ({ ...entry, locale: "en" })))).toBeNull();
  });

  it.each([
    { targetLevel: "UNKNOWN", skillDimension: "READING", passed: true },
    { targetLevel: "B3", skillDimension: "READING", passed: true },
    { targetLevel: null, skillDimension: "READING", passed: true },
    { targetLevel: "A1", skillDimension: "UNKNOWN", passed: true },
    { targetLevel: "A1", skillDimension: "READING", passed: "true" },
    { targetLevel: "A1", skillDimension: "READING", passed: false, locale: "en" },
    { targetLevel: "A1", skillDimension: "READING", passed: true, locale: null },
    {}, null,
  ])("returns null for unsupported or invalid input %#", (input) => {
    expect(selectSkillGuidance(input)).toBeNull();
  });

  it("returns null without throwing when content is missing", () => {
    const input = { targetLevel: "A2", skillDimension: "WRITING", passed: false, locale: "vi" };
    expect(selectSkillGuidance(input, [])).toBeNull();
    expect(selectSkillGuidance(input, null)).toBeNull();
  });
});
