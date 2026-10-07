import { ApiError } from "@/shared/api/api-error";
import { isTimestamp, isNullableTimestamp } from "../attempt/attempt-response";

const STATUSES = ["IN_PROGRESS", "SUBMITTED", "EXPIRED", "CANCELLED"];
const TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"];
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;
const isOrder = (value) => Number.isInteger(value) && value > 0;
const isUniqueIds = (value) => Array.isArray(value) && value.every(isNonblank) && new Set(value).size === value.length;

function invalid(kind) {
  throw new ApiError({ message: `The server returned an invalid assessment task ${kind} response.` });
}

function isTaskAttempt(value, assessmentAttemptId, taskId) {
  return isObject(value) && isNonblank(value.assessmentAttemptId) &&
    value.assessmentAttemptId === assessmentAttemptId && isNonblank(value.taskId) &&
    value.taskId === taskId && isNonblank(value.quizAttemptId) && isNonblank(value.quizId) &&
    isNonblank(value.quizRevisionId) && STATUSES.includes(value.status) &&
    isTimestamp(value.startedAt) && isNullableTimestamp(value.expiresAt);
}

function isQuestion(value) {
  if (!isObject(value) || !isNonblank(value.questionId) || !isNonblank(value.content) ||
      !TYPES.includes(value.type) || !isOrder(value.order) || !Array.isArray(value.options) ||
      !value.options.every((option) => isObject(option) && isNonblank(option.answerId) &&
        isNonblank(option.content) && isOrder(option.order))) return false;
  const optionIds = value.options.map((option) => option.answerId);
  return isUniqueIds(optionIds) && isUniqueIds(value.selectedAnswerIds) &&
    value.selectedAnswerIds.every((id) => optionIds.includes(id)) &&
    (value.type === "MULTIPLE_CHOICE" || value.selectedAnswerIds.length <= 1);
}

export function parseStartedTask(value, assessmentAttemptId, taskId) {
  if (!isTaskAttempt(value, assessmentAttemptId, taskId)) invalid("start");
  return value;
}

export function parseTaskRuntime(value, assessmentAttemptId, taskId) {
  if (!isTaskAttempt(value, assessmentAttemptId, taskId) ||
      !isNullableTimestamp(value.submittedAt) || !Array.isArray(value.questions) ||
      !value.questions.every(isQuestion)) invalid("runtime");
  return value;
}

function isMutationIdentity(value, runtime, question) {
  return isObject(value) && value.status === "IN_PROGRESS" &&
    ["assessmentAttemptId", "taskId", "quizAttemptId"].every((field) =>
      isNonblank(value[field]) && value[field] === runtime[field]) &&
    isNonblank(value.questionId) && value.questionId === question.questionId;
}

export function parseSavedAnswer(value, runtime, question, requestedIds) {
  if (!isMutationIdentity(value, runtime, question) || !isUniqueIds(value.selectedAnswerIds) ||
      value.selectedAnswerIds.length === 0 || value.selectedAnswerIds.length !== requestedIds.length ||
      !value.selectedAnswerIds.every((id) => requestedIds.includes(id) &&
        question.options.some((option) => option.answerId === id))) invalid("answer");
  return value;
}

export function parseClearedAnswer(value, runtime, question) {
  if (!isMutationIdentity(value, runtime, question)) invalid("clear");
  return value;
}
