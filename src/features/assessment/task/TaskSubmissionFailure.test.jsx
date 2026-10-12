import { seedNextActivity } from "@/test/next-activity-fixtures";
import { seedDirection } from "@/test/direction-fixtures";
import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, ok } from "@/test/http";
import { ATTEMPT_ID, resumedAttempt } from "../test/attempt-fixtures";
import { mountAssessmentApp } from "../test/assessment-app";
import { submissionHttp, submitRequests, runtimeReads, answerRequests } from "../test/submission-app";
import {
  TASK_KEY, TASK_PATH, TASK_SUBMIT_URL, taskRuntime, submittedTask, savedAnswer,
} from "../test/task-fixtures";

function reject(config, status, message) {
  throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code: 9999, message },
  });
}

describe("Submit failure canonical reconciliation", () => {
  it("allows explicit correction and retry after REQUIRED_ALL-style 400, with one fresh read and no local required labels", async () => {
    const user = userEvent.setup();
    let reads = 0;
    let failed = true;
    const stored = taskRuntime();
    const refresh = deferred();
    const http = submissionHttp((config) => {
      if (config.url === TASK_SUBMIT_URL) return failed
        ? reject(config, 400, "Submission rejected") : ok(config, submittedTask());
      const ids = JSON.parse(config.data).selectedAnswerIds;
      stored.questions[2].selectedAnswerIds = ids;
      return ok(config, savedAnswer("question-boolean", ids));
    }, { runtimeRead: (config) => ++reads === 1
      ? ok(config, structuredClone(stored))
      : refresh.promise.then(() => ok(config, structuredClone(stored))) });
    const { client, router } = mountAssessmentApp(TASK_PATH);
    const activity = seedNextActivity(client);
    const direction = seedDirection(client);
    client.setQueryData(["learner-learning-journey"], { unchanged: true });
    client.setQueryData(["learner-assessment-attempt", ATTEMPT_ID], resumedAttempt());
    await user.click(await screen.findByRole("button", { name: "Nộp bài tập" }));
    await waitFor(() => expect(reads).toBe(2));
    // Reconciliation is still part of the Task-local submit fence.
    expect(screen.getByRole("button", { name: "Nộp bài tập" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Das stimmt" })).toBeDisabled();
    await act(async () => { refresh.resolve(); });
    await screen.findByText("Máy chủ từ chối yêu cầu nộp bài tập. Vui lòng kiểm tra lại trạng thái trước khi thử lại.");
    expect(client.getQueryData(TASK_KEY)).toEqual(stored);
    activity(false);
    direction(false);
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(submitRequests(http)).toHaveLength(1);
    expect(runtimeReads(http)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Nộp bài tập" })).toBeEnabled();
    expect(screen.getByRole("region", { name: "Bài tập đánh giá" }).textContent).not.toMatch(/required|all answered|eligible/i);
    await user.click(screen.getByRole("radio", { name: "Das stimmt" }));
    await waitFor(() => expect(client.getQueryData(TASK_KEY).questions[2].selectedAnswerIds).toEqual(["answer-stimmt"]));
    expect(answerRequests(http)).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole("button", { name: "Nộp bài tập" }));
    await screen.findByText("Trạng thái: Đã nộp");
    expect(screen.queryByText("Máy chủ từ chối yêu cầu nộp bài tập. Vui lòng kiểm tra lại trạng thái trước khi thử lại.")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Das stimmt" })).toBeChecked();
    activity(true);
    direction(false);
    expect(submitRequests(http)).toHaveLength(2);
    expect(runtimeReads(http)).toHaveLength(2);
  });

  it.each([
    [404, "IN_PROGRESS"], [409, "EXPIRED"], [409, "CANCELLED"], [500, "SUBMITTED"], ["network", "SUBMITTED"],
  ])("reconciles %s failure through one GET reporting %s without another POST", async (failure, status) => {
    const user = userEvent.setup();
    let reads = 0;
    const fresh = taskRuntime({ status });
    const http = submissionHttp((config) => {
      if (failure === "network") throw new AxiosError("Connection lost", AxiosError.ERR_NETWORK, config);
      return reject(config, failure, "Original submit failure");
    }, { runtimeRead: (config) => ok(config, ++reads === 1 ? taskRuntime() : fresh) });
    const { client, router } = mountAssessmentApp(TASK_PATH);
    const activity = seedNextActivity(client);
    const direction = seedDirection(client);
    client.setQueryData(["learner-learning-journey"], { unchanged: true });
    client.setQueryData(["learner-assessment-attempt", ATTEMPT_ID], resumedAttempt());
    await user.click(await screen.findByRole("button", { name: "Nộp bài tập" }));
    if (status === "IN_PROGRESS") {
      await screen.findByText("Máy chủ từ chối yêu cầu nộp bài tập. Vui lòng kiểm tra lại trạng thái trước khi thử lại.");
      expect(screen.getByRole("button", { name: "Nộp bài tập" })).toBeEnabled();
      expect(screen.getByRole("radio", { name: "Hallo" })).toBeEnabled();
    } else {
      await screen.findByText(`Trạng thái: ${status === "EXPIRED" ? "Hết hạn" : status === "CANCELLED" ? "Đã hủy" : "Đã nộp"}`);
      expect(screen.queryByRole("button", { name: /submit|clear|xóa|nộp/i })).not.toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Hallo" })).toBeDisabled();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      if (status === "SUBMITTED") expect(screen.getByRole("link", { name: "Tiếp tục bài đánh giá" })).toBeInTheDocument();
      else expect(screen.queryByRole("link", { name: "Tiếp tục bài đánh giá" })).not.toBeInTheDocument();
    }
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(client.getQueryData(TASK_KEY)).toEqual(fresh);
    activity(status !== "IN_PROGRESS");
    direction(false);
    expect(client.getQueryState(["learner-learning-journey"]).isInvalidated).toBe(false);
    expect(client.getQueryState(["learner-assessment-attempt", ATTEMPT_ID]).isInvalidated).toBe(status === "SUBMITTED");
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(submitRequests(http)).toHaveLength(1);
    expect(runtimeReads(http)).toHaveLength(2);
    expect(answerRequests(http)).toHaveLength(0);
  });

  it.each(["HTTP failure", "malformed runtime"])("retains original Submit error and saved evidence when refresh has %s", async (failure) => {
    const user = userEvent.setup();
    let reads = 0;
    const http = submissionHttp((config) => reject(config, 409, "Original submit failure"), {
      runtimeRead: (config) => {
        if (++reads === 1) return ok(config, taskRuntime());
        return failure === "HTTP failure"
          ? reject(config, 500, "Refresh failed")
          : ok(config, taskRuntime({ taskId: "wrong-task" }));
      },
    });
    const { client } = mountAssessmentApp(TASK_PATH);
    const activity = seedNextActivity(client);
    const direction = seedDirection(client);
    await user.click(await screen.findByRole("button", { name: "Nộp bài tập" }));
    const boundary = screen.getByRole("region", { name: "Nộp bài tập" });
    expect(await within(boundary).findByRole("alert")).toHaveTextContent("Máy chủ từ chối yêu cầu nộp bài tập. Vui lòng kiểm tra lại trạng thái trước khi thử lại.");
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    activity(false);
    direction(false);
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Hallo" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Nộp bài tập" })).toBeEnabled();
    expect(screen.queryByText("Refresh failed")).not.toBeInTheDocument();
    expect(screen.queryByText("Đã xảy ra lỗi")).not.toBeInTheDocument();
    expect(runtimeReads(http)).toHaveLength(2);
    expect(submitRequests(http)).toHaveLength(1);
  });

  it("keeps question answer errors separate from the focused Submit error", async () => {
    const user = userEvent.setup();
    const http = submissionHttp((config) => reject(config, config.method === "put" ? 400 : 409,
      config.method === "put" ? "Question save failed" : "Task submit failed"));
    mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("radio", { name: "Hallo" }));
    await screen.findByText("Máy chủ từ chối yêu cầu cập nhật câu trả lời. Vui lòng kiểm tra lại trạng thái trước khi thử lại.");
    await user.click(screen.getByRole("button", { name: "Nộp bài tập" }));
    expect(await within(screen.getByRole("region", { name: "Nộp bài tập" })).findByRole("alert"))
      .toHaveTextContent("Máy chủ từ chối yêu cầu nộp bài tập. Vui lòng kiểm tra lại trạng thái trước khi thử lại.");
    expect(within(screen.getByRole("group", { name: "Câu hỏi 3" })).getByRole("alert"))
      .toHaveTextContent("Máy chủ từ chối yêu cầu cập nhật câu trả lời. Vui lòng kiểm tra lại trạng thái trước khi thử lại.");
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(submitRequests(http)).toHaveLength(1);
    expect(runtimeReads(http)).toHaveLength(2);
  });
});
