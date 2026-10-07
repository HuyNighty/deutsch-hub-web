import { describe, it, expect } from "vitest";
import { act, fireEvent, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { deferred, ok } from "@/test/http";
import { mountAssessmentApp } from "../test/assessment-app";
import { submissionHttp, submitRequests, runtimeReads } from "../test/submission-app";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl, resumedAttempt } from "../test/attempt-fixtures";
import {
  TASK_KEY, TASK_PATH, TASK_SUBMIT_URL, SUBMITTED_AT, taskRuntime, submittedTask, startedTask,
} from "../test/task-fixtures";

describe("Task submission and parent progression", () => {
  it("offers Submit for IN_PROGRESS without inferring completion policy from unanswered Questions", async () => {
    const runtime = taskRuntime();
    runtime.questions.forEach((question) => { question.selectedAnswerIds = []; });
    const http = submissionHttp(() => { throw new Error("Explicit action required"); }, { runtime });
    mountAssessmentApp(TASK_PATH);
    expect(await screen.findByRole("button", { name: "Submit task" })).toBeEnabled();
    expect(screen.getAllByRole("radio").every((input) => !input.checked)).toBe(true);
    expect(submitRequests(http)).toHaveLength(0);
  });

  it("submits once without a body, keeps Questions/selections, invalidates only parent and stays on Task", async () => {
    const response = deferred();
    const runtime = taskRuntime();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const preservedKeys = [
      ["learner-learning-journey"], ["learner-assessments", { page: 0, size: 20 }],
      ["my-courses"], ["sentinel"], [TASK_KEY[0], ATTEMPT_ID, "other-task"],
    ];
    for (const key of preservedKeys) client.setQueryData(key, { unchanged: true });
    client.setQueryData(["learner-assessment-attempt", ATTEMPT_ID], resumedAttempt());
    const http = submissionHttp((config) => response.promise.then(() => ok(config, submittedTask())), { runtime });
    const { router } = mountAssessmentApp(TASK_PATH, { client });
    const button = await screen.findByRole("button", { name: "Submit task" });
    expect(client.getQueryData(TASK_KEY)).toEqual(runtime);
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    await waitFor(() => expect(submitRequests(http)).toHaveLength(1));
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(submitRequests(http)[0][0]).toMatchObject({ method: "post", url: TASK_SUBMIT_URL, data: undefined });
    expect(client.getMutationCache().getAll().find((mutation) => mutation.state.status === "pending").options.mutationKey)
      .toEqual(["learner-assessment-task-submit", ATTEMPT_ID, runtime.taskId]);
    expect(client.getQueryData(TASK_KEY)).toEqual(runtime);
    await act(async () => { response.resolve(); });
    await screen.findByText("Status: Submitted");
    const cached = client.getQueryData(TASK_KEY);
    expect(cached).toEqual({ ...runtime, status: "SUBMITTED", submittedAt: SUBMITTED_AT });
    expect(cached.questions).toEqual(runtime.questions);
    expect(cached.questions).toBe(runtime.questions);
    expect(client.getQueryState(["learner-assessment-attempt", ATTEMPT_ID]).isInvalidated).toBe(true);
    expect(client.getQueryState(["learner-assessment-attempt-definition", ATTEMPT_ID]).isInvalidated).toBe(false);
    for (const key of preservedKeys) {
      expect(client.getQueryData(key)).toEqual({ unchanged: true });
      expect(client.getQueryState(key).isInvalidated).toBe(false);
    }
    expect(router.state.location.pathname).toBe(TASK_PATH);
    for (const input of [...screen.getAllByRole("radio"), ...screen.getAllByRole("checkbox")]) expect(input).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Haus" })).toBeChecked();
    expect(screen.queryByRole("button", { name: /clear|submit/i })).not.toBeInTheDocument();
    const submission = screen.getByRole("region", { name: "Task submission" });
    expect(within(submission).getByText(/Submitted:/)).toBeInTheDocument();
    expect(submission.querySelector("time").dateTime).toBe(SUBMITTED_AT);
    expect(submission.querySelector("time").textContent.trim()).not.toBe("");
    expect(within(submission).getByRole("link", { name: "Continue assessment" })).toHaveAttribute("href", attemptPath);
    expect(screen.getByRole("region", { name: "Assessment task" }).textContent)
      .not.toMatch(/correct|incorrect|score|percentage|passed|failed|next task/i);
    expect(runtimeReads(http)).toHaveLength(1);
    expect(submitRequests(http)).toHaveLength(1);
  });

  it.each(["SUBMITTED", "EXPIRED", "CANCELLED"])("initial %s stays readonly and never offers Submit", async (status) => {
    const http = submissionHttp(() => { throw new Error("No write expected"); }, { runtime: taskRuntime({ status }) });
    mountAssessmentApp(TASK_PATH);
    await screen.findByRole("radio", { name: "Hallo" });
    expect(screen.queryByRole("button", { name: /clear|submit/i })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Hallo" })).toBeDisabled();
    if (status === "SUBMITTED") {
      expect(screen.getByRole("link", { name: "Continue assessment" })).toBeInTheDocument();
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
    } else {
      expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
      expect(screen.queryByText(/Submitted:/)).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to Assessment" })).toBeInTheDocument();
    }
    expect(submitRequests(http)).toHaveLength(0);
  });

  it("accepts persisted retry-recovery outcome, then lets the learner explicitly start a later sequential Task from parent", async () => {
    const user = userEvent.setup();
    const definition = assessmentDetail();
    definition.components[0].executionMode = "SEQUENTIAL";
    const laterTaskId = "task-writing-2";
    const laterPath = `${attemptPath}/tasks/${laterTaskId}`;
    const laterUrl = `${attemptUrl}/tasks/${laterTaskId}/quiz-attempt`;
    const parent = resumedAttempt();
    let committed = false;
    const http = submissionHttp((config) => {
      if (config.url === TASK_SUBMIT_URL) {
        committed = true;
        return ok(config, submittedTask());
      }
      if (config.url === attemptUrl) return ok(config, parent);
      if (config.url === laterUrl) return ok(config, config.method === "post"
        ? startedTask({ taskId: laterTaskId, quizAttemptId: "quiz-later" })
        : taskRuntime({ taskId: laterTaskId, quizAttemptId: "quiz-later" }));
      throw new Error(`Unexpected progression request: ${config.url}`);
    }, { definition, runtimeRead: (config) => ok(config, taskRuntime({ status: committed ? "SUBMITTED" : "IN_PROGRESS" })) });
    const { router, client } = mountAssessmentApp(TASK_PATH);
    client.setQueryData(["learner-assessment-attempt", ATTEMPT_ID], parent);
    await user.click(await screen.findByRole("button", { name: "Submit task" }));
    await screen.findByText("Status: Submitted");
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(http.mock.calls.filter(([config]) => config.method === "post")).toHaveLength(1);
    await user.click(screen.getByRole("link", { name: "Continue assessment" }));
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
    await waitFor(() => expect(http.mock.calls.some(([config]) => config.url === attemptUrl)).toBe(true));
    expect(screen.getByRole("link", { name: "Continue task" })).toHaveAttribute("href", TASK_PATH);
    const laterRow = screen.getByText("Task 2").closest("li");
    expect(within(laterRow).getByRole("button", { name: "Start task" })).toBeEnabled();
    expect(laterRow.textContent).not.toMatch(/unlock|eligible|completed/i);
    // Returning to the predecessor reads canonical SUBMITTED evidence without re-submission.
    await user.click(screen.getByRole("link", { name: "Continue task" }));
    await screen.findByText("Status: Submitted");
    await user.click(screen.getByRole("link", { name: "Continue assessment" }));
    await screen.findByRole("heading", { name: "Writing" });
    await user.click(within(screen.getByText("Task 2").closest("li")).getByRole("button", { name: "Start task" }));
    await screen.findByRole("heading", { name: "Task 2" });
    expect(router.state.location.pathname).toBe(laterPath);
    expect(http.mock.calls.filter(([config]) => config.method === "post").map(([config]) => config.url))
      .toEqual([TASK_SUBMIT_URL, laterUrl]);
    expect(submitRequests(http)).toHaveLength(1);
    expect(http.mock.calls.some(([config]) => config.url === `${attemptUrl}/submit`)).toBe(false);
  });

  it.each([
    ["null", null], ["array", []],
    ["blank parent", submittedTask({ assessmentAttemptId: " " })],
    ["wrong parent", submittedTask({ assessmentAttemptId: "other" })],
    ["wrong Task", submittedTask({ taskId: "other" })],
    ["wrong QuizAttempt", submittedTask({ quizAttemptId: "other" })],
    ["IN_PROGRESS", submittedTask({ status: "IN_PROGRESS" })],
    ["EXPIRED", submittedTask({ status: "EXPIRED" })],
    ["missing time", submittedTask({ submittedAt: undefined })],
    ["null time", submittedTask({ submittedAt: null })],
    ["invalid time", submittedTask({ submittedAt: "yesterday" })],
  ])("rejects malformed successful Submit %s without cache transition, navigation or failure refetch", async (_, result) => {
    const user = userEvent.setup();
    const http = submissionHttp((config) => ok(config, result));
    const { client, router } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("button", { name: "Submit task" }));
    expect(await within(screen.getByRole("region", { name: "Task submission" })).findByRole("alert"))
      .toHaveTextContent("invalid assessment task submit");
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(runtimeReads(http)).toHaveLength(1);
    expect(submitRequests(http)).toHaveLength(1);
  });

  it("keeps malformed successful envelopes out of failure reconciliation", async () => {
    const user = userEvent.setup();
    const http = submissionHttp((config) => ({ ...ok(config, submittedTask()), data: { result: submittedTask() } }));
    const { client } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("button", { name: "Submit task" }));
    await screen.findByText("The server returned an unexpected response.");
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    expect(runtimeReads(http)).toHaveLength(1);
  });
});
