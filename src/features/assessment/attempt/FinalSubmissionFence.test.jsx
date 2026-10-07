import { describe, it, expect } from "vitest";
import { act, fireEvent, screen, within, waitFor, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { deferred, fail, ok } from "@/test/http";
import { mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl, resumedAttempt } from "../test/attempt-fixtures";
import { FINAL_URL, finalHttp, finalResult, finalRequests } from "../test/final-submit-fixtures";
import {
  TASK_PATH, TASK_URL, TASK_SUBMIT_URL, TASK_KEY, taskRuntime, submittedTask, savedAnswer, clearedAnswer,
} from "../test/task-fixtures";
import { useTaskAnswer } from "../task/hooks/useTaskAnswer";
import { useSubmitTask } from "../task/hooks/useSubmitTask";

function startButton() {
  return within(screen.getByText("Task 2").closest("li")).getByRole("button", { name: "Start task" });
}

describe("Attempt-scoped final submission fences", () => {
  it("same-batch Task Start then Final Submit starts only Task Start", async () => {
    const response = deferred();
    const url = `${attemptUrl}/tasks/task-writing-2/quiz-attempt`;
    const http = finalHttp((config) => response.promise.then(() => fail(config, 409)), { allowTaskExecution: true });
    const { client } = mountAssessmentApp(attemptPath);
    await screen.findByRole("button", { name: "Submit assessment" });
    act(() => { fireEvent.click(startButton()); fireEvent.click(screen.getByRole("button", { name: "Submit assessment" })); });
    await waitFor(() => expect(http.mock.calls.filter(([config]) => config.method === "post")).toHaveLength(1));
    expect(http.mock.calls.find(([config]) => config.method === "post")[0].url).toBe(url);
    expect(finalRequests(http)).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Submit assessment" })).toBeDisabled();
    expect(client.getMutationCache().getAll().find((mutation) => mutation.state.status === "pending").options.mutationKey)
      .toEqual(["learner-assessment-task-start", ATTEMPT_ID, "task-writing-2"]);
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit assessment" })).toBeEnabled());
    expect(finalRequests(http)).toHaveLength(0);
  });

  it("same-batch Final Submit then Task Start starts only Final Submit and disables Starts", async () => {
    const response = deferred();
    let reads = 0;
    const http = finalHttp((config) => response.promise.then(() => ok(config, finalResult())), {
      parentRead: (config) => ok(config, resumedAttempt({ status: ++reads === 1 ? "IN_PROGRESS" : "COMPLETED" })),
      allowTaskExecution: true,
    });
    mountAssessmentApp(attemptPath);
    const submit = await screen.findByRole("button", { name: "Submit assessment" });
    const start = startButton();
    act(() => { fireEvent.click(submit); fireEvent.click(start); fireEvent.click(submit); });
    await waitFor(() => expect(finalRequests(http)).toHaveLength(1));
    for (const button of screen.getAllByRole("button", { name: "Start task" })) expect(button).toBeDisabled();
    expect(screen.getByRole("link", { name: "Continue task" })).toHaveAttribute("href", TASK_PATH);
    expect(http.mock.calls.filter(([config]) => config.method === "post").map(([config]) => config.url)).toEqual([FINAL_URL]);
    await act(async () => { response.resolve(); });
    await screen.findByText("Assessment finalized successfully.");
  });

  it.each(["put", "delete", "task submit"])("a lingering %s still blocks Final Submit after navigating back to parent", async (method) => {
    const user = userEvent.setup();
    const response = deferred();
    const http = finalHttp((config) => {
      if (config.method === "get" && config.url === TASK_URL) return ok(config, taskRuntime());
      return response.promise.then(() => ok(config, method === "task submit" ? submittedTask()
        : method === "put" ? savedAnswer("question-single", ["answer-hallo"]) : clearedAnswer("question-single")));
    }, { allowTaskExecution: true, allowTaskSubmit: method === "task submit" });
    const { client, router } = mountAssessmentApp(TASK_PATH);
    await screen.findByRole("button", { name: "Submit task" });
    await user.click(method === "put" ? screen.getByRole("radio", { name: "Hallo" })
      : method === "delete" ? within(screen.getByRole("group", { name: "Question 3" })).getByRole("button", { name: "Clear answer" })
      : screen.getByRole("button", { name: "Submit task" }));
    await waitFor(() => expect(client.isMutating()).toBe(1));
    await act(async () => { await router.navigate(attemptPath); });
    const final = await screen.findByRole("button", { name: "Submit assessment" });
    expect(final).toBeDisabled();
    fireEvent.click(final);
    expect(finalRequests(http)).toHaveLength(0);
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(final).toBeEnabled());
    expect(finalRequests(http)).toHaveLength(0);
    expect(http.mock.calls.filter(([config]) => config.method !== "get")).toHaveLength(1);
  });

  it("pending parent Final Submit fences Task controls and synchronous answer/clear/submit handlers after navigation", async () => {
    const user = userEvent.setup();
    const response = deferred();
    let reads = 0;
    const http = finalHttp((config) => config.method === "get" && config.url === TASK_URL
      ? ok(config, taskRuntime()) : response.promise.then(() => ok(config, finalResult())), {
      parentRead: (config) => ok(config, resumedAttempt({ status: ++reads === 1 ? "IN_PROGRESS" : "EXPIRED" })),
      allowTaskExecution: true, allowTaskSubmit: true,
    });
    const { client, router } = mountAssessmentApp(attemptPath);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    await waitFor(() => expect(finalRequests(http)).toHaveLength(1));
    await act(async () => { await router.navigate(TASK_PATH); });
    await screen.findByRole("heading", { name: "Task 4" });
    for (const input of [...screen.getAllByRole("radio"), ...screen.getAllByRole("checkbox")]) expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submit task" })).toBeDisabled();
    const clear = within(screen.getByRole("group", { name: "Question 3" })).getByRole("button", { name: "Clear answer" });
    expect(clear).toBeDisabled();
    // Call real hooks' synchronous handlers as well as checking disabled DOM controls.
    const runtime = client.getQueryData(TASK_KEY);
    function Wrapper({ children }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
    const answer = renderHook(() => useTaskAnswer(runtime, runtime.questions[0]), { wrapper: Wrapper });
    const submit = renderHook(() => useSubmitTask(runtime), { wrapper: Wrapper });
    act(() => { answer.result.current.save(["answer-hallo"]); answer.result.current.save([]); submit.result.current.submit(); });
    expect(client.isMutating()).toBe(1);
    expect(http.mock.calls.filter(([config]) => config.method !== "get").map(([config]) => config.url)).toEqual([FINAL_URL]);
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(http.mock.calls.some(([config]) => config.url === TASK_SUBMIT_URL)).toBe(false);
    answer.unmount();
    submit.unmount();
  });

  it.each(["put", "task submit"])("pending %s for Attempt A does not block Final Submit for Attempt B", async (method) => {
    const user = userEvent.setup();
    const response = deferred();
    const otherId = "attempt-other";
    const otherUrl = `/me/assessment-attempts/${otherId}`;
    const otherPath = `/my-learning/assessment-attempts/${otherId}`;
    let otherReads = 0;
    const http = finalHttp((config) => {
      if (config.method === "get" && config.url === TASK_URL) return ok(config, taskRuntime());
      if (config.url === otherUrl) return ok(config, resumedAttempt({ assessmentAttemptId: otherId, status: ++otherReads === 1 ? "IN_PROGRESS" : "COMPLETED" }));
      if (config.url === `${otherUrl}/assessment`) return ok(config, assessmentDetail());
      if (config.url === `${otherUrl}/submit`) return ok(config, finalResult({ assessmentAttemptId: otherId }));
      return response.promise.then(() => ok(config, method === "put" ? savedAnswer("question-single", ["answer-hallo"]) : submittedTask()));
    }, { allowTaskExecution: true, allowTaskSubmit: method === "task submit" });
    const { router, client } = mountAssessmentApp(TASK_PATH);
    await screen.findByRole("button", { name: "Submit task" });
    await user.click(method === "put" ? screen.getByRole("radio", { name: "Hallo" }) : screen.getByRole("button", { name: "Submit task" }));
    await waitFor(() => expect(client.isMutating()).toBe(1));
    await act(async () => { await router.navigate(otherPath); });
    const final = await screen.findByRole("button", { name: "Submit assessment" });
    expect(final).toBeEnabled();
    await user.click(final);
    await screen.findByText("Assessment finalized successfully.");
    expect(client.getQueryData(["learner-assessment-attempt", otherId]).status).toBe("COMPLETED");
    expect(client.isMutating()).toBe(1); // Attempt A still pending independently.
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(client.getQueryData(["learner-assessment-attempt", otherId]).status).toBe("COMPLETED");
    expect(http.mock.calls.filter(([config]) => config.url === `${otherUrl}/submit`)).toHaveLength(1);
  });
});
