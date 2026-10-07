import { ApiError } from "@/shared/api/api-error";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;

export function parseLearningDirection(value) {
  const valid = isObject(value) && (
    (value.type === "RESUME_ASSESSMENT" && isObject(value.target) && isNonblank(value.target.assessmentAttemptId)) ||
    (value.type === "CONTINUE_COURSE" && isObject(value.target) && isNonblank(value.target.courseId)) ||
    (value.type === "DISCOVER_COURSE" && value.target === null)
  );
  if (!valid) throw new ApiError({ message: "The server returned an invalid learning direction response." });
  return value;
}
