import { describe, it, expect } from "vitest";
import { act, fireEvent, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { attemptUrl } from "../test/attempt-fixtures";
import { TASK_KEY, TASK_PATH, TASK_URL, taskRuntime, savedAnswer, clearedAnswer } from "../test/task-fixtures";

function answerHttp(handler, runtime = taskRuntime()) {
  return assessmentHttp((config) => {
    if (config.url === TASK_URL) return ok(config, runtime);
    if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
    return handler(config);
  }, { allowTaskExecution: true });
}
function group(name) { return screen.getByRole("group", { name }); }
function mutations(http) { return http.mock.calls.filter(([config]) => config.method !== "get"); }
function selections(client, questionId) {
  return client.getQueryData(TASK_KEY).questions.find((q) => q.questionId === questionId).selectedAnswerIds;
}

describe("server-authoritative Task answers", () => {
  it.each([
    ["single choice", "radio", "Hallo", "question-single", ["answer-hallo"]],
    ["TRUE_FALSE", "radio", "Das stimmt", "question-boolean", ["answer-stimmt"]],
    ["multiple choice", "checkbox", "Baum", "question-multiple", ["answer-haus", "answer-baum"]],
  ])("persists %s with one complete-selection PUT and updates only the target Question", async (_, role, option, questionId, ids) => {
    const user = userEvent.setup();
    const http = answerHttp((config) => ok(config, savedAnswer(questionId, [...ids].reverse())));
    const { client } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole(role, { name: option }));
    await waitFor(() => expect(selections(client, questionId)).toEqual([...ids].reverse()));
    expect(mutations(http)).toHaveLength(1);
    expect(mutations(http)[0][0]).toMatchObject({ method: "put", url: `${TASK_URL}/answers/${questionId}` });
    expect(JSON.parse(mutations(http)[0][0].data)).toEqual({ selectedAnswerIds: ids });
    const original = taskRuntime();
    const cached = client.getQueryData(TASK_KEY);
    expect(cached.quizId).toBe(original.quizId);
    expect(cached.questions).toHaveLength(3);
    for (const question of original.questions.filter((q) => q.questionId !== questionId)) {
      expect(cached.questions.find((q) => q.questionId === question.questionId)).toEqual(question);
    }
    expect(cached.status).toBe("IN_PROGRESS");
    expect(screen.getByRole(role, { name: option })).toBeChecked();
  });

  it("changes a saved radio answer again using the current canonical selection", async () => {
    const user = userEvent.setup();
    const http = answerHttp((config) => ok(config, savedAnswer("question-single", JSON.parse(config.data).selectedAnswerIds)));
    const { client } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("radio", { name: "Hallo" }));
    await waitFor(() => expect(selections(client, "question-single")).toEqual(["answer-hallo"]));
    await user.click(screen.getByRole("radio", { name: "Guten Tag" }));
    await waitFor(() => expect(selections(client, "question-single")).toEqual(["answer-guten-tag"]));
    expect(mutations(http).map(([config]) => JSON.parse(config.data))).toEqual([
      { selectedAnswerIds: ["answer-hallo"] }, { selectedAnswerIds: ["answer-guten-tag"] },
    ]);
  });

  it("unchecks the last checkbox with bodyless DELETE, never PUT []", async () => {
    const user = userEvent.setup();
    const http = answerHttp((config) => ok(config, clearedAnswer("question-multiple")));
    const { client } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("checkbox", { name: "Haus" }));
    await waitFor(() => expect(selections(client, "question-multiple")).toEqual([]));
    expect(mutations(http)).toHaveLength(1);
    expect(mutations(http)[0][0]).toMatchObject({
      method: "delete", url: `${TASK_URL}/answers/question-multiple`, data: undefined,
    });
    expect(screen.getByRole("checkbox", { name: "Haus" })).not.toBeChecked();
    expect(selections(client, "question-single")).toEqual(["answer-guten-tag"]);
    expect(within(group("Question 1")).queryByRole("button", { name: "Clear answer" })).not.toBeInTheDocument();
  });

  it("explicit Clear answer sends bodyless DELETE and clears only the saved radio Question", async () => {
    const user = userEvent.setup();
    const http = answerHttp((config) => ok(config, clearedAnswer("question-single")));
    const { client } = mountAssessmentApp(TASK_PATH);
    await screen.findByRole("radio", { name: "Hallo" });
    await user.click(within(group("Question 3")).getByRole("button", { name: "Clear answer" }));
    await waitFor(() => expect(selections(client, "question-single")).toEqual([]));
    expect(mutations(http)[0][0]).toMatchObject({
      method: "delete", url: `${TASK_URL}/answers/question-single`, data: undefined,
    });
    expect(screen.getByRole("radio", { name: "Guten Tag" })).not.toBeChecked();
    expect(selections(client, "question-multiple")).toEqual(["answer-haus"]);
    expect(client.getQueryData(TASK_KEY).questions).toHaveLength(3);
  });

  it.each(["put", "delete"])("fences same-question %s interactions, disables only its controls and keeps saved data while pending", async (method) => {
    const read = deferred();
    const http = answerHttp((config) => read.promise.then(() => ok(config, method === "put"
      ? savedAnswer("question-single", ["answer-hallo"]) : clearedAnswer("question-single"))));
    const { client } = mountAssessmentApp(TASK_PATH);
    await screen.findByRole("radio", { name: "Hallo" });
    const target = method === "put" ? screen.getByRole("radio", { name: "Hallo" })
      : within(group("Question 3")).getByRole("button", { name: "Clear answer" });
    act(() => {
      fireEvent.click(target);
      fireEvent.click(within(group("Question 3")).getByRole("button", { name: "Clear answer" }));
    });
    await waitFor(() => expect(mutations(http)).toHaveLength(1));
    for (const input of within(group("Question 3")).getAllByRole("radio")) expect(input).toBeDisabled();
    expect(within(group("Question 3")).getByRole("button", { name: "Clear answer" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Baum" })).toBeEnabled();
    expect(selections(client, "question-single")).toEqual(["answer-guten-tag"]);
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    await act(async () => { read.resolve(); });
    await waitFor(() => expect(selections(client, "question-single")).toEqual(method === "put" ? ["answer-hallo"] : []));
    expect(mutations(http)).toHaveLength(1);
  });

  it.each([
    ["parent mismatch", { assessmentAttemptId: "other-parent" }],
    ["task mismatch", { taskId: "other-task" }],
    ["QuizAttempt mismatch", { quizAttemptId: "other-quiz" }],
    ["Question mismatch", { questionId: "question-multiple" }],
    ["status", { status: "EXPIRED" }],
    ["foreign IDs", { selectedAnswerIds: ["answer-haus"] }],
    ["duplicate IDs", { selectedAnswerIds: ["answer-hallo", "answer-hallo"] }],
    ["empty IDs", { selectedAnswerIds: [] }],
    ["different requested set", { selectedAnswerIds: ["answer-guten-tag"] }],
  ])("rejects malformed PUT %s and preserves the complete previous runtime cache", async (_, overrides) => {
    const user = userEvent.setup();
    answerHttp((config) => ok(config, savedAnswer("question-single", ["answer-hallo"], overrides)));
    const { client, router } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("radio", { name: "Hallo" }));
    expect(await within(group("Question 3")).findByRole("alert")).toHaveTextContent("invalid assessment task answer");
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(router.state.location.pathname).toBe(TASK_PATH);
  });

  it.each([
    ["parent mismatch", { assessmentAttemptId: "other-parent" }],
    ["task mismatch", { taskId: "other-task" }],
    ["QuizAttempt mismatch", { quizAttemptId: "other-quiz" }],
    ["Question mismatch", { questionId: "question-multiple" }],
    ["status", { status: "SUBMITTED" }],
  ])("rejects malformed DELETE %s without clearing saved selections", async (_, overrides) => {
    const user = userEvent.setup();
    answerHttp((config) => ok(config, clearedAnswer("question-single", overrides)));
    const { client } = mountAssessmentApp(TASK_PATH);
    await screen.findByRole("radio", { name: "Hallo" });
    await user.click(within(group("Question 3")).getByRole("button", { name: "Clear answer" }));
    expect(await within(group("Question 3")).findByRole("alert")).toHaveTextContent("invalid assessment task clear");
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
  });

  it.each(["put", "delete"])("retains saved selection and focused error on failed %s, allowing explicit retry", async (method) => {
    const user = userEvent.setup();
    let failed = true;
    const http = answerHttp((config) => failed ? fail(config, 409) : ok(config, method === "put"
      ? savedAnswer("question-single", ["answer-hallo"]) : clearedAnswer("question-single")));
    const { client, router } = mountAssessmentApp(TASK_PATH);
    await screen.findByRole("radio", { name: "Hallo" });
    const interact = () => user.click(method === "put" ? screen.getByRole("radio", { name: "Hallo" })
      : within(group("Question 3")).getByRole("button", { name: "Clear answer" }));
    await interact();
    expect(await within(group("Question 3")).findByRole("alert")).toHaveTextContent("HTTP failure");
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(mutations(http)).toHaveLength(1);
    failed = false;
    await interact();
    await waitFor(() => expect(selections(client, "question-single")).toEqual(method === "put" ? ["answer-hallo"] : []));
    expect(mutations(http)).toHaveLength(2);
  });

  it("restores persisted changes from a new GET and fresh QueryClient after remount", async () => {
    const user = userEvent.setup();
    let stored = taskRuntime();
    const http = assessmentHttp((config) => {
      if (config.url === TASK_URL) return ok(config, structuredClone(stored));
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      const ids = JSON.parse(config.data).selectedAnswerIds;
      stored = { ...stored, questions: stored.questions.map((q) => q.questionId === "question-single"
        ? { ...q, selectedAnswerIds: ids } : q) };
      return ok(config, savedAnswer("question-single", ids));
    }, { allowTaskExecution: true });
    const first = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("radio", { name: "Hallo" }));
    await waitFor(() => expect(selections(first.client, "question-single")).toEqual(["answer-hallo"]));
    first.unmount();
    const second = mountAssessmentApp(TASK_PATH);
    const input = await screen.findByRole("radio", { name: "Hallo" });
    expect(input).toBeChecked();
    expect(screen.getByRole("radio", { name: "Guten Tag" })).not.toBeChecked();
    expect(second.client).not.toBe(first.client);
    expect(selections(second.client, "question-single")).toEqual(["answer-hallo"]);
    expect(http.mock.calls.filter(([config]) => config.url === TASK_URL && config.method === "get")).toHaveLength(2);
    expect(mutations(http)).toHaveLength(1);
  });

  it("keeps a late saved response tied to its originating Task after navigation", async () => {
    const user = userEvent.setup();
    const response = deferred();
    const secondId = "task-writing-2";
    const secondPath = TASK_PATH.replace("task-writing-4", secondId);
    const secondUrl = TASK_URL.replace("task-writing-4", secondId);
    const secondKey = [TASK_KEY[0], TASK_KEY[1], secondId];
    const secondRuntime = taskRuntime({ taskId: secondId, quizAttemptId: "quiz-second" });
    const http = assessmentHttp((config) => {
      if (config.url === TASK_URL) return ok(config, taskRuntime());
      if (config.url === secondUrl) return ok(config, secondRuntime);
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      return response.promise.then(() => ok(config, savedAnswer("question-single", ["answer-hallo"])));
    }, { allowTaskExecution: true });
    const { client, router } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("radio", { name: "Hallo" }));
    await waitFor(() => expect(mutations(http)).toHaveLength(1));
    await act(async () => { await router.navigate(secondPath); });
    await screen.findByRole("heading", { name: "Task 2" });
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(selections(client, "question-single")).toEqual(["answer-hallo"]));
    expect(client.getQueryData(secondKey)).toEqual(secondRuntime);
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(router.state.location.pathname).toBe(secondPath);
    expect(mutations(http)).toHaveLength(1);
  });

  it("does not overwrite a newer Backend terminal read with a delayed IN_PROGRESS answer response", async () => {
    const user = userEvent.setup();
    const response = deferred();
    let reads = 0;
    const terminal = taskRuntime({ status: "EXPIRED" });
    terminal.questions[0].selectedAnswerIds = ["answer-hallo"];
    const http = assessmentHttp((config) => {
      if (config.url === TASK_URL) return ok(config, ++reads === 1 ? taskRuntime() : terminal);
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      return response.promise.then(() => ok(config, savedAnswer("question-single", ["answer-hallo"])));
    }, { allowTaskExecution: true });
    const { client } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("radio", { name: "Hallo" }));
    await waitFor(() => expect(mutations(http)).toHaveLength(1));
    await act(async () => { await client.refetchQueries({ queryKey: TASK_KEY, exact: true }); });
    await screen.findByText("Status: Expired");
    await act(async () => { response.resolve(); });
    expect(client.getQueryData(TASK_KEY)).toEqual(terminal);
    expect(screen.getByRole("radio", { name: "Hallo" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Hallo" })).toBeDisabled();
  });
});
