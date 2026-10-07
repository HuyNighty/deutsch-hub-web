import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { parseNextActivity } from "./next-activity-response";

const actionable = [
  { type: "OPEN_LESSON", target: { courseId: "course /?#", lessonId: "lesson /?#" } },
  { type: "RESUME_ASSESSMENT_TASK", target: { assessmentAttemptId: "attempt", taskId: "task", quizAttemptId: "quiz" } },
  { type: "OPEN_ASSESSMENT", target: { assessmentAttemptId: "attempt" } },
];

describe("Next Activity semantic contract", () => {
  it.each([
    ...actionable, { type: "NONE", target: null },
    ...actionable.map((value) => ({ ...value, future: true, target: { ...value.target, future: true } })),
    { type: "NONE", target: null, future: true },
  ].map((value) => [value]))("accepts required shape and preserves response %j", (value) => {
    expect(parseNextActivity(value)).toBe(value);
  });
  it.each([
    null, undefined, [], "activity", 1, true, {}, { type: "UNKNOWN", target: null },
    ...actionable.flatMap((value) => [
      { type: value.type }, { type: value.type, target: null }, { type: value.type, target: [] },
      ...Object.keys(value.target).flatMap((key) => [
        { ...value, target: Object.fromEntries(Object.entries(value.target).filter(([name]) => name !== key)) },
        ...["", " \n", 42, null, false, {}, []].map((id) => ({ ...value, target: { ...value.target, [key]: id } })),
      ]),
    ]),
    { type: "OPEN_ASSESSMENT", target: { courseId: "wrong" } },
    { type: "NONE", target: {} }, { type: "NONE" },
  ].map((value) => [value]))("rejects invalid response %j", (value) => {
    expect(() => parseNextActivity(value)).toThrow(ApiError);
    expect(() => parseNextActivity(value)).toThrow("The server returned an invalid next activity response.");
  });
});
