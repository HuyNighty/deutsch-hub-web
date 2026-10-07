import { ApiError } from "@/shared/api/api-error";

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const STATUSES = ["CREATED", "IN_PROGRESS", "COMPLETED", "EXPIRED", "CANCELLED"];
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;
// Backend Instants include a time and zone; date-only values are not timestamps.
export function isTimestamp(value) {
  if (!isNonblank(value)) return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value))) return false;
  const [, year, month, day] = parts.map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Date.parse otherwise normalizes impossible calendar dates such as February 30.
  return day >= 1 && day <= days[month - 1];
}
export const isNullableTimestamp = (value) => value === null || isTimestamp(value);

function invalid(kind) {
  throw new ApiError({ message: `The server returned an invalid ${kind} response.` });
}

export function parseLearningJourney(value) {
  if (!isObject(value) || !Array.isArray(value.assessmentAttempts) ||
      !value.assessmentAttempts.every((attempt) => isObject(attempt) &&
        isNonblank(attempt.assessmentAttemptId) && isNonblank(attempt.assessmentId) &&
        LEVELS.includes(attempt.targetLevel) && attempt.status === "IN_PROGRESS" &&
        isTimestamp(attempt.startedAt) && isNullableTimestamp(attempt.expiresAt))) {
    invalid("learning journey");
  }
  return value;
}

export function parseStartedAttempt(value, assessmentId) {
  if (!isObject(value) || !isNonblank(value.id) || !isNonblank(value.assessmentId) ||
      value.assessmentId !== assessmentId || !isNonblank(value.userId) ||
      value.status !== "IN_PROGRESS" || !isTimestamp(value.startedAt) ||
      !isNullableTimestamp(value.expiresAt) || !Array.isArray(value.taskAttempts) ||
      !value.taskAttempts.every((task) => isObject(task) && isNonblank(task.id) &&
        isNonblank(task.taskId) && (task.quizAttemptId === null || isNonblank(task.quizAttemptId)))) {
    invalid("assessment start");
  }
  return value;
}

export function parseAssessmentAttempt(value, assessmentAttemptId) {
  if (!isObject(value) || !isNonblank(value.assessmentAttemptId) ||
      value.assessmentAttemptId !== assessmentAttemptId || !isNonblank(value.assessmentId) ||
      !STATUSES.includes(value.status) || !isNullableTimestamp(value.startedAt) ||
      !isNullableTimestamp(value.expiresAt) || !Array.isArray(value.taskAttempts) ||
      !value.taskAttempts.every((task) => isObject(task) &&
        isNonblank(task.taskId) && isNonblank(task.quizAttemptId))) {
    invalid("assessment attempt");
  }
  return value;
}
