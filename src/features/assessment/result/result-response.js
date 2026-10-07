import { ApiError } from "@/shared/api/api-error";
import { isAssessmentResult } from "../shared/assessment-result-response";

export function parseAssessmentResult(value, assessmentAttemptId, definition) {
  if (!isAssessmentResult(value, assessmentAttemptId, definition)) {
    throw new ApiError({ message: "The server returned an invalid assessment result response." });
  }
  return value;
}

export function parseCompetency(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      value.learningDomain !== "DEUTSCH" ||
      !["UNKNOWN", "A0", "A1", "A2", "B1", "B2", "C1", "C2"].includes(value.currentLevel)) {
    throw new ApiError({ message: "The server returned an invalid competency response." });
  }
  return value;
}
