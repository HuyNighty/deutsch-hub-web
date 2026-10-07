import { ApiError } from "@/shared/api/api-error";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;

export function parseNextActivity(value) {
  const valid = isObject(value) && (
    (value.type === "OPEN_LESSON" && isObject(value.target) &&
      isNonblank(value.target.courseId) && isNonblank(value.target.lessonId)) ||
    (value.type === "RESUME_ASSESSMENT_TASK" && isObject(value.target) &&
      isNonblank(value.target.assessmentAttemptId) && isNonblank(value.target.taskId) &&
      isNonblank(value.target.quizAttemptId)) ||
    (value.type === "OPEN_ASSESSMENT" && isObject(value.target) && isNonblank(value.target.assessmentAttemptId)) ||
    (value.type === "NONE" && value.target === null)
  );
  if (!valid) throw new ApiError({ message: "The server returned an invalid next activity response." });
  return value;
}
