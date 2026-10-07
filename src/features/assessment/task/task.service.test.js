import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { ok } from "@/test/http";
import { seedSession } from "@/test/session-fixtures";
import { assessmentHttp } from "../test/assessment-app";
import { ATTEMPT_ID } from "../test/attempt-fixtures";
import { TASK_ID, TASK_URL, startedTask, taskRuntime, savedAnswer, clearedAnswer } from "../test/task-fixtures";
import { startTask, getTaskRuntime, saveTaskAnswer, clearTaskAnswer } from "./task.service";

function response(result) {
  seedSession();
  return assessmentHttp((config) => ok(config, result), { allowTaskExecution: true });
}
function invalidQuestion(change) {
  const result = taskRuntime();
  change(result.questions[0]);
  return result;
}

describe("Task Start and runtime contract validation", () => {
  it.each([
    ["non-object", null],
    ["array", []],
    ["blank parent", startedTask({ assessmentAttemptId: " " })],
    ["wrong parent", startedTask({ assessmentAttemptId: "other" })],
    ["blank task", startedTask({ taskId: "" })],
    ["wrong task", startedTask({ taskId: "other" })],
    ["blank QuizAttempt", startedTask({ quizAttemptId: " " })],
    ["missing quiz", startedTask({ quizId: undefined })],
    ["blank revision", startedTask({ quizRevisionId: "" })],
    ["CREATED status", startedTask({ status: "CREATED" })],
    ["missing start", startedTask({ startedAt: undefined })],
    ["null start", startedTask({ startedAt: null })],
    ["invalid timestamp", startedTask({ startedAt: "yesterday" })],
    ["impossible date", startedTask({ startedAt: "2025-02-30T08:00:00Z" })],
    ["missing deadline", startedTask({ expiresAt: undefined })],
    ["invalid deadline", startedTask({ expiresAt: "2025-06-01" })],
  ])("rejects Start %s before navigation is possible", async (_, result) => {
    response(result);
    await expect(startTask(ATTEMPT_ID, TASK_ID)).rejects.toBeInstanceOf(ApiError);
  });

  it.each(["IN_PROGRESS", "SUBMITTED", "EXPIRED", "CANCELLED"])("accepts Start recovery status %s and sends no body", async (status) => {
    const result = startedTask({ status, expiresAt: null });
    const http = response(result);
    await expect(startTask(ATTEMPT_ID, TASK_ID)).resolves.toEqual(result);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "post", url: TASK_URL, data: undefined });
  });

  it.each([
    ["missing submittedAt", taskRuntime({ submittedAt: undefined })],
    ["invalid submittedAt", taskRuntime({ submittedAt: " " })],
    ["nonarray questions", taskRuntime({ questions: {} })],
    ["null question", taskRuntime({ questions: [null] })],
    ["blank question ID", invalidQuestion((q) => { q.questionId = " "; })],
    ["blank content", invalidQuestion((q) => { q.content = ""; })],
    ["unknown type", invalidQuestion((q) => { q.type = "ESSAY"; })],
    ["fractional order", invalidQuestion((q) => { q.order = 1.5; })],
    ["zero order", invalidQuestion((q) => { q.order = 0; })],
    ["nonarray options", invalidQuestion((q) => { q.options = null; })],
    ["null option", invalidQuestion((q) => { q.options = [null]; })],
    ["blank option ID", invalidQuestion((q) => { q.options[0].answerId = ""; })],
    ["blank option content", invalidQuestion((q) => { q.options[0].content = " "; })],
    ["invalid option order", invalidQuestion((q) => { q.options[0].order = -1; })],
    ["duplicate option ID", invalidQuestion((q) => { q.options[1].answerId = q.options[0].answerId; })],
    ["missing selections", invalidQuestion((q) => { q.selectedAnswerIds = undefined; })],
    ["nonarray selections", invalidQuestion((q) => { q.selectedAnswerIds = {}; })],
    ["blank selection", invalidQuestion((q) => { q.selectedAnswerIds = [" "]; })],
    ["duplicate selection", invalidQuestion((q) => { q.selectedAnswerIds = ["answer-hallo", "answer-hallo"]; })],
    ["foreign selection", invalidQuestion((q) => { q.selectedAnswerIds = ["answer-haus"]; })],
    ["too many single selections", invalidQuestion((q) => { q.selectedAnswerIds = ["answer-hallo", "answer-guten-tag"]; })],
    ["too many boolean selections", invalidQuestion((q) => { q.type = "TRUE_FALSE"; q.selectedAnswerIds = ["answer-hallo", "answer-guten-tag"]; })],
  ])("rejects whole runtime for %s", async (_, result) => {
    response(result);
    await expect(getTaskRuntime(ATTEMPT_ID, TASK_ID)).rejects.toBeInstanceOf(ApiError);
  });

  it("accepts unanswered questions and multiple saved selections without sorting or correctness fields", async () => {
    const result = taskRuntime();
    result.questions[0].selectedAnswerIds = [];
    result.questions[1].selectedAnswerIds = ["answer-baum", "answer-haus"];
    const http = response(result);
    await expect(getTaskRuntime(ATTEMPT_ID, TASK_ID)).resolves.toEqual(result);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "get", url: TASK_URL });
    expect(result).not.toHaveProperty("score");
  });
});

describe("Answer and clear response boundaries", () => {
  const runtime = taskRuntime();
  const question = runtime.questions[0];
  it.each([
    ["non-object", null],
    ["blank parent", savedAnswer(question.questionId, ["answer-hallo"], { assessmentAttemptId: " " })],
    ["wrong parent", savedAnswer(question.questionId, ["answer-hallo"], { assessmentAttemptId: "other" })],
    ["wrong task", savedAnswer(question.questionId, ["answer-hallo"], { taskId: "other" })],
    ["wrong child", savedAnswer(question.questionId, ["answer-hallo"], { quizAttemptId: "other" })],
    ["wrong question", savedAnswer("other-question", ["answer-hallo"])],
    ["terminal status", savedAnswer(question.questionId, ["answer-hallo"], { status: "SUBMITTED" })],
    ["missing selection", savedAnswer(question.questionId, undefined)],
    ["empty selection", savedAnswer(question.questionId, [])],
    ["blank selection", savedAnswer(question.questionId, [" "])],
    ["foreign selection", savedAnswer(question.questionId, ["answer-haus"])],
    ["different selection", savedAnswer(question.questionId, ["answer-guten-tag"])],
    ["duplicate selection", savedAnswer(question.questionId, ["answer-hallo", "answer-hallo"])],
  ])("rejects successful answer %s", async (_, result) => {
    response(result);
    await expect(saveTaskAnswer(runtime, question, ["answer-hallo"])).rejects.toBeInstanceOf(ApiError);
  });

  it("does not issue an empty PUT", async () => {
    const http = response(null);
    await expect(saveTaskAnswer(runtime, question, [])).rejects.toBeInstanceOf(ApiError);
    expect(http).not.toHaveBeenCalled();
  });

  it.each([
    ["non-object", null],
    ["blank parent", clearedAnswer(question.questionId, { assessmentAttemptId: "" })],
    ["wrong parent", clearedAnswer(question.questionId, { assessmentAttemptId: "other" })],
    ["wrong task", clearedAnswer(question.questionId, { taskId: "other" })],
    ["wrong child", clearedAnswer(question.questionId, { quizAttemptId: "other" })],
    ["wrong question", clearedAnswer("other-question")],
    ["wrong status", clearedAnswer(question.questionId, { status: "EXPIRED" })],
  ])("rejects successful clear %s", async (_, result) => {
    response(result);
    await expect(clearTaskAnswer(runtime, question)).rejects.toBeInstanceOf(ApiError);
  });
});
