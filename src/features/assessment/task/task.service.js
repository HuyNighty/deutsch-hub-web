import apiClient from "@/shared/api/api-client";
import { ApiError } from "@/shared/api/api-error";
import {
  parseStartedTask, parseTaskRuntime, parseSavedAnswer, parseClearedAnswer, parseSubmittedTask,
} from "./task-response";

function taskUrl(assessmentAttemptId, taskId) {
  return `/me/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}/tasks/${encodeURIComponent(taskId)}/quiz-attempt`;
}

export async function startTask(assessmentAttemptId, taskId) {
  return parseStartedTask(await apiClient.post(taskUrl(assessmentAttemptId, taskId)), assessmentAttemptId, taskId);
}

export async function getTaskRuntime(assessmentAttemptId, taskId) {
  return parseTaskRuntime(await apiClient.get(taskUrl(assessmentAttemptId, taskId)), assessmentAttemptId, taskId);
}

export async function submitTask(runtime) {
  const result = await apiClient.post(`${taskUrl(runtime.assessmentAttemptId, runtime.taskId)}/submit`);
  return parseSubmittedTask(result, runtime);
}

export async function saveTaskAnswer(runtime, question, selectedAnswerIds) {
  if (selectedAnswerIds.length === 0) {
    throw new ApiError({ message: "Choose an answer before saving." });
  }
  const result = await apiClient.put(
    `${taskUrl(runtime.assessmentAttemptId, runtime.taskId)}/answers/${encodeURIComponent(question.questionId)}`,
    { selectedAnswerIds },
  );
  return parseSavedAnswer(result, runtime, question, selectedAnswerIds);
}

export async function clearTaskAnswer(runtime, question) {
  const result = await apiClient.delete(
    `${taskUrl(runtime.assessmentAttemptId, runtime.taskId)}/answers/${encodeURIComponent(question.questionId)}`,
  );
  return parseClearedAnswer(result, runtime, question);
}
