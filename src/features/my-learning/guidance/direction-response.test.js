import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { parseLearningDirection } from "./direction-response";

describe("Learning Direction semantic contract", () => {
  it.each([
    { type: "RESUME_ASSESSMENT", target: { assessmentAttemptId: "attempt /?#" } },
    { type: "CONTINUE_COURSE", target: { courseId: "course /?#" } },
    { type: "DISCOVER_COURSE", target: null },
    { type: "CONTINUE_COURSE", target: { courseId: "course", future: true }, future: true },
  ])("accepts required shape and preserves response %j", (value) => {
    expect(parseLearningDirection(value)).toBe(value);
  });
  it.each([
    null, undefined, [], "direction", 1, true, {},
    { type: "UNKNOWN", target: null },
    ...["RESUME_ASSESSMENT", "CONTINUE_COURSE"].flatMap((type) => [
      { type, target: null }, { type, target: [] }, { type },
      { type, target: { [type === "RESUME_ASSESSMENT" ? "courseId" : "assessmentAttemptId"]: "wrong" } },
      ...["", " \n", 42, null].map((id) => ({ type, target: { [type === "RESUME_ASSESSMENT" ? "assessmentAttemptId" : "courseId"]: id } })),
    ]),
    { type: "DISCOVER_COURSE", target: {} }, { type: "DISCOVER_COURSE" },
  ])("rejects invalid response %j", (value) => {
    expect(() => parseLearningDirection(value)).toThrow(ApiError);
    expect(() => parseLearningDirection(value)).toThrow("The server returned an invalid learning direction response.");
  });
});
