import { ApiError } from "@/shared/api/api-error";

const TARGET_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const SKILLS = ["LISTENING", "READING", "WRITING", "SPEAKING"];
const EXECUTION_MODES = ["SEQUENTIAL", "INDEPENDENT"];

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;
const isNonnegativeInteger = (value) => Number.isInteger(value) && value >= 0;
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

function isAssessment(value) {
  return isObject(value) &&
    isNonblank(value.assessmentId) &&
    (value.title === null || isNonblank(value.title)) &&
    TARGET_LEVELS.includes(value.targetLevel) &&
    (value.timeLimitMinutes === null || isPositiveInteger(value.timeLimitMinutes));
}

function isTask(value) {
  return isObject(value) &&
    isNonblank(value.taskId) &&
    isPositiveInteger(value.order) &&
    isNonblank(value.quizRevisionId);
}

function isComponent(value) {
  return isObject(value) &&
    isNonblank(value.componentId) &&
    SKILLS.includes(value.skillDimension) &&
    EXECUTION_MODES.includes(value.executionMode) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask);
}

function invalidResponse() {
  throw new ApiError({ message: "The server returned an invalid assessment response." });
}

export function parseAssessmentPage(value) {
  if (!isObject(value) ||
      !Array.isArray(value.items) ||
      !isNonnegativeInteger(value.page) ||
      !isPositiveInteger(value.size) ||
      !isNonnegativeInteger(value.totalElements) ||
      !isNonnegativeInteger(value.totalPages) ||
      !value.items.every((item) => isAssessment(item) && item.status === "ACTIVE")) {
    invalidResponse();
  }
  return value;
}

export function parseAssessmentDetail(value) {
  if (!isAssessment(value) ||
      !Array.isArray(value.components) ||
      !value.components.every(isComponent)) {
    invalidResponse();
  }
  return value;
}
