import { describe, it, expect } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { loginResult } from "@/test/session-fixtures";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail, ASSESSMENT_ID } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl, resumedAttempt } from "../test/attempt-fixtures";
import { TASK_KEY, TASK_PATH, TASK_URL, TASK_DEADLINE, taskRuntime } from "../test/task-fixtures";

function runtimeHttp(result, definition = assessmentDetail()) {
  return assessmentHttp((config) => {
    if (config.url === TASK_URL) return ok(config, result);
    if (config.url === `${attemptUrl}/assessment`) return ok(config, definition);
    if (config.url === `/me/assessments/${ASSESSMENT_ID}`) return fail(config, 404);
    throw new Error(`Unexpected request: ${config.url}`);
  }, { allowTaskExecution: true });
}

describe("Assessment Task runtime", () => {
  it("GETs canonical runtime and stable archived definition, preserves order, restores controls, and hides IDs/correctness", async () => {
    const runtime = taskRuntime();
    const http = runtimeHttp(runtime);
    const { client } = mountAssessmentApp(TASK_PATH);
    const hello = await screen.findByRole("radio", { name: "Hallo" });
    expect(hello).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Haus" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Das stimmt" })).not.toBeChecked();
    const region = screen.getByRole("region", { name: "Assessment task" });
    expect(within(region).getByRole("heading", { name: "B1 Placement Assessment" })).toBeInTheDocument();
    expect(within(region).getByText("Writing")).toBeInTheDocument();
    expect(within(region).getByRole("heading", { name: "Task 4" })).toBeInTheDocument();
    expect(within(region).getByText("Status: In progress")).toBeInTheDocument();
    const time = region.querySelector("time");
    expect(time.dateTime).toBe(TASK_DEADLINE);
    expect(time.textContent.trim()).not.toBe("");
    expect(within(region).getAllByRole("group").map((group) => group.querySelector("legend").textContent))
      .toEqual(["Question 3", "Question 1", "Question 2"]);
    expect(within(region).getAllByRole("radio").map((input) => input.closest("label").textContent))
      .toEqual(["Guten Tag", "Hallo", "Das stimmt", "Das stimmt nicht"]);
    expect(within(region).getAllByRole("checkbox").map((input) => input.closest("label").textContent))
      .toEqual(["Haus", "Baum", "schnell"]);
    const ids = [ATTEMPT_ID, runtime.taskId, runtime.quizAttemptId, runtime.quizId, runtime.quizRevisionId,
      ...runtime.questions.flatMap((question) => [question.questionId, ...question.options.map((option) => option.answerId)])];
    for (const id of ids) expect(region.textContent).not.toContain(id);
    expect(region.textContent).not.toMatch(/correct|incorrect|score|passed|failed|pass\/fail|percentage/i);
    expect(within(region).getByRole("button", { name: "Submit task" })).toBeEnabled();
    expect(within(region).queryByRole("button", { name: /finish|next task/i })).not.toBeInTheDocument();
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([TASK_URL, `${attemptUrl}/assessment`]);
    expect(client.getQueryData(TASK_KEY)).toEqual(runtime);
    expect(client.getQueryData(["learner-assessment-attempt-definition", ATTEMPT_ID])).toEqual(assessmentDetail());
    expect(client.getQueryData(["learner-assessment", ASSESSMENT_ID])).toBeUndefined();
    expect(client.getQueryData(["quiz", runtime.quizAttemptId])).toBeUndefined();
  });

  it.each([["SUBMITTED", "Submitted"], ["EXPIRED", "Expired"], ["CANCELLED", "Cancelled"]])(
    "renders child %s questions and saved selections readonly, without mutation or redirect", async (status, label) => {
      const user = userEvent.setup();
      const http = runtimeHttp(taskRuntime({ status, expiresAt: null }), assessmentDetail({ title: null }));
      const { router } = mountAssessmentApp(TASK_PATH);
      await screen.findByText(`Status: ${label}`);
      expect(screen.getByRole("heading", { name: "Untitled assessment" })).toBeInTheDocument();
      expect(screen.getByText("Deadline: No time limit")).toBeInTheDocument();
      for (const input of [...screen.getAllByRole("radio"), ...screen.getAllByRole("checkbox")]) expect(input).toBeDisabled();
      expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
      await user.click(screen.getByRole("radio", { name: "Hallo" }));
      expect(screen.queryByRole("button", { name: /clear|submit|finish|next/i })).not.toBeInTheDocument();
      expect(router.state.location.pathname).toBe(TASK_PATH);
      expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
    },
  );

  it.each([
    ["parent identity", taskRuntime({ assessmentAttemptId: "other-parent" })],
    ["task identity", taskRuntime({ taskId: "other-task" })],
    ["wrong type", (() => { const result = taskRuntime(); result.questions[0].type = "TEXT"; return result; })()],
    ["bad order", (() => { const result = taskRuntime(); result.questions[0].order = 0; return result; })()],
    ["duplicate option", (() => { const result = taskRuntime(); result.questions[0].options.push(result.questions[0].options[0]); return result; })()],
    ["foreign selection", (() => { const result = taskRuntime(); result.questions[0].selectedAnswerIds = ["answer-haus"]; return result; })()],
    ["multiple radio selection", (() => { const result = taskRuntime(); result.questions[0].selectedAnswerIds = ["answer-hallo", "answer-guten-tag"]; return result; })()],
  ])("rejects malformed runtime %s without partial Questions", async (_, runtime) => {
    runtimeHttp(runtime);
    const { client } = mountAssessmentApp(TASK_PATH);
    await screen.findByText("Đã xảy ra lỗi");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText("Choose a greeting.")).not.toBeInTheDocument();
    expect(client.getQueryData(TASK_KEY)).toBeUndefined();
  });

  it.each(["missing task", "invalid definition"])("rejects stable context with %s", async (kind) => {
    runtimeHttp(taskRuntime(), kind === "missing task" ? assessmentDetail({ components: [] }) : assessmentDetail({ targetLevel: "UNKNOWN" }));
    mountAssessmentApp(TASK_PATH);
    await screen.findByText("Đã xảy ra lỗi");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it.each(["runtime", "definition"])("waits for %s rather than rendering partial execution", async (pending) => {
    const read = deferred();
    assessmentHttp((config) => {
      const isRuntime = config.url === TASK_URL;
      const result = isRuntime ? taskRuntime() : assessmentDetail();
      return isRuntime === (pending === "runtime") ? read.promise.then(() => ok(config, result)) : ok(config, result);
    }, { allowTaskExecution: true });
    const { client } = mountAssessmentApp(TASK_PATH);
    const completed = pending === "runtime" ? ["learner-assessment-attempt-definition", ATTEMPT_ID] : TASK_KEY;
    await waitFor(() => expect(client.getQueryData(completed)).toBeDefined());
    expect(screen.getByText("Đang tải...")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await act(async () => { read.resolve(); });
    await screen.findByRole("radio", { name: "Hallo" });
  });

  it.each([[403, "Không có quyền truy cập"], [404, "Không tìm thấy tài nguyên"]])(
    "handles direct unbound/foreign Task %s without auto-start or session termination", async (status, copy) => {
      const user = userEvent.setup();
      const http = assessmentHttp((config) => {
        if (config.url === TASK_URL) return fail(config, status);
        if (config.url === attemptUrl) return ok(config, resumedAttempt());
        if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
        throw new Error(`Unexpected request: ${config.url}`);
      }, { allowTaskExecution: true });
      const { router, auth } = mountAssessmentApp(TASK_PATH);
      await screen.findByText(copy);
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
      await user.click(screen.getByRole("link", { name: "Return to Assessment" }));
      await screen.findByText("Status: In progress");
      expect(router.state.location.pathname).toBe(attemptPath);
      expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
    },
  );

  it("reuses the production protected route and preserves Task returnTo through Login", async () => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => {
      if (config.url === "/auth/login") return ok(config, loginResult());
      if (config.url === TASK_URL) return ok(config, taskRuntime());
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      throw new Error(`Unexpected request: ${config.url}`);
    }, { allowTaskExecution: true });
    const { router } = mountAssessmentApp(TASK_PATH, { anonymous: true });
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: TASK_PATH });
    expect(http).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Tên đăng nhập hoặc email"), "learner");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ }));
    await screen.findByRole("radio", { name: "Hallo" });
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(["/auth/login", TASK_URL, `${attemptUrl}/assessment`]);
  });
});
