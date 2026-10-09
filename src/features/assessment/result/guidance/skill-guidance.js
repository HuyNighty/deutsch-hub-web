import approved from "./fe3-m6-c1-guidance-vi-approved.json";

const OFFICIAL_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
export const guidanceEntries = Object.freeze(approved.entries.map((entry) => Object.freeze(entry)));

export function selectSkillGuidance(input = {}, entries = guidanceEntries) {
  const { targetLevel, skillDimension, passed, locale = "vi" } = input ?? {};
  if (!OFFICIAL_LEVELS.includes(targetLevel) || typeof passed !== "boolean" ||
      locale !== "vi" || !Array.isArray(entries)) return null;

  const matches = (entry) => entry.locale === locale &&
    entry.skillDimension === skillDimension && entry.passed === passed;
  return entries.find((entry) => matches(entry) && entry.targetLevel === targetLevel) ??
    entries.find((entry) => matches(entry) && entry.targetLevel === null) ?? null;
}
