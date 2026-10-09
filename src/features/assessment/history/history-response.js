import { ApiError } from "@/shared/api/api-error";
import { isNullableTimestamp } from "../attempt/attempt-response";

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const STATUSES = ["COMPLETED", "EXPIRED", "CANCELLED"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isUuid = (value) => typeof value === "string" && UUID.test(value);
const isNonnegativeInteger = (value) => Number.isSafeInteger(value) && value >= 0;

function isHistoryItem(value) {
  return isObject(value) &&
    isUuid(value.assessmentAttemptId) && isUuid(value.assessmentId) &&
    (value.assessmentTitle === null ||
      (typeof value.assessmentTitle === "string" && value.assessmentTitle.trim().length > 0)) &&
    LEVELS.includes(value.targetLevel) && STATUSES.includes(value.status) &&
    isNullableTimestamp(value.startedAt) && isNullableTimestamp(value.expiresAt) &&
    typeof value.resultAvailable === "boolean" &&
    (value.passed === null || typeof value.passed === "boolean") &&
    (value.resultAvailable || value.passed === null);
}

export function parseAssessmentHistoryPage(value, pagination) {
  if (!isObject(value) || !Array.isArray(value.items) ||
      !isNonnegativeInteger(value.page) || !Number.isSafeInteger(value.size) || value.size <= 0 ||
      !isNonnegativeInteger(value.totalElements) || !isNonnegativeInteger(value.totalPages) ||
      value.totalPages !== Math.ceil(value.totalElements / value.size) ||
      value.items.length > value.size || value.items.length > value.totalElements ||
      // Spring Data permits an empty page beyond the last page.
      (value.items.length > 0 && value.page >= value.totalPages) ||
      (pagination && (value.page !== pagination.page || value.size !== pagination.size)) ||
      !value.items.every(isHistoryItem)) {
    throw new ApiError({ message: "The server returned an invalid assessment history response." });
  }
  return value;
}
