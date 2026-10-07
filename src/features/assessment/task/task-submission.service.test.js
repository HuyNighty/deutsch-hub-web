import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { ok } from "@/test/http";
import { seedSession } from "@/test/session-fixtures";
import { assessmentHttp } from "../test/assessment-app";
import { ATTEMPT_ID } from "../test/attempt-fixtures";
import { TASK_ID, TASK_SUBMIT_URL, SUBMITTED_AT, taskRuntime, submittedTask } from "../test/task-fixtures";
import { submitTask, getTaskRuntime } from "./task.service";
import { TaskSubmitResponseError } from "./task-response";

describe("Submit response contract", () => {
  it.each([
    ["null", null], ["array", []], ["primitive", "submitted"],
    ["blank parent", submittedTask({ assessmentAttemptId: " " })],
    ["blank task", submittedTask({ taskId: "" })],
    ["blank child", submittedTask({ quizAttemptId: " " })],
    ["wrong parent", submittedTask({ assessmentAttemptId: "other" })],
    ["wrong task", submittedTask({ taskId: "other" })],
    ["wrong child", submittedTask({ quizAttemptId: "other" })],
    ["missing status", submittedTask({ status: undefined })],
    ["IN_PROGRESS", submittedTask({ status: "IN_PROGRESS" })],
    ["EXPIRED", submittedTask({ status: "EXPIRED" })],
    ["missing timestamp", submittedTask({ submittedAt: undefined })],
    ["null timestamp", submittedTask({ submittedAt: null })],
    ["numeric timestamp", submittedTask({ submittedAt: 42 })],
    ["date only", submittedTask({ submittedAt: "2025-06-01" })],
    ["impossible date", submittedTask({ submittedAt: "2025-02-30T08:00:00Z" })],
  ])("rejects %s with a local ApiError classification", async (_, result) => {
    seedSession();
    const http = assessmentHttp((config) => ok(config, result), { allowTaskSubmit: true });
    const error = await submitTask(taskRuntime()).catch((error) => error);
    expect(error).toBeInstanceOf(TaskSubmitResponseError);
    expect(error).toBeInstanceOf(ApiError);
    expect(http).toHaveBeenCalledTimes(1);
  });

  it("returns validated persisted submission outcome with one bodyless POST", async () => {
    seedSession();
    const http = assessmentHttp((config) => ok(config, submittedTask()), { allowTaskSubmit: true });
    await expect(submitTask(taskRuntime())).resolves.toEqual(submittedTask());
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "post", url: TASK_SUBMIT_URL, data: undefined });
  });

  it.each([null, undefined, "invalid"])("rejects SUBMITTED runtime with submittedAt %s", async (submittedAt) => {
    seedSession();
    assessmentHttp((config) => ok(config, taskRuntime({ status: "SUBMITTED", submittedAt })), { allowTaskExecution: true });
    await expect(getTaskRuntime(ATTEMPT_ID, TASK_ID)).rejects.toBeInstanceOf(ApiError);
  });

  it.each(["IN_PROGRESS", "EXPIRED", "CANCELLED"])("does not invent stricter historical submittedAt constraints for %s", async (status) => {
    seedSession();
    const runtime = taskRuntime({ status, submittedAt: SUBMITTED_AT });
    assessmentHttp((config) => ok(config, runtime), { allowTaskExecution: true });
    await expect(getTaskRuntime(ATTEMPT_ID, TASK_ID)).resolves.toEqual(runtime);
  });
});
