import { describe, it, expect } from "vitest";
import { act, fireEvent, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { submissionHttp, submitRequests, answerRequests } from "../test/submission-app";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl } from "../test/attempt-fixtures";
import {
  TASK_KEY, TASK_PATH, TASK_URL, taskRuntime, submittedTask, savedAnswer, clearedAnswer,
} from "../test/task-fixtures";

function clearButton() {
  return within(screen.getByRole("group", { name: "Question 3" })).getByRole("button", { name: "Clear answer" });
}

describe("Task-local answer / submit fences", () => {
  it.each(["put", "delete"])("blocks Submit while %s is pending, including a same-batch click", async (method) => {
    const response = deferred();
    const http = submissionHttp((config) => response.promise.then(() => ok(config, method === "put"
      ? savedAnswer("question-single", ["answer-hallo"]) : clearedAnswer("question-single"))));
    const { client } = mountAssessmentApp(TASK_PATH);
    const submit = await screen.findByRole("button", { name: "Submit task" });
    act(() => {
      fireEvent.click(method === "put" ? screen.getByRole("radio", { name: "Hallo" }) : clearButton());
      fireEvent.click(submit);
    });
    await waitFor(() => expect(answerRequests(http)).toHaveLength(1));
    expect(submitRequests(http)).toHaveLength(0);
    expect(submit).toBeDisabled();
    expect(client.getMutationCache().getAll().find((mutation) => mutation.state.status === "pending").options.mutationKey)
      .toEqual(["learner-assessment-task-answer", ATTEMPT_ID, "task-writing-4", "question-single"]);
    expect(screen.getByRole("checkbox", { name: "Baum" })).toBeEnabled();
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(submitRequests(http)).toHaveLength(0);
  });

  it("fences same-batch Submit then Answer/Clear, and disables every Question until settlement", async () => {
    const response = deferred();
    const http = submissionHttp((config) => response.promise.then(() => ok(config, submittedTask())));
    const { client } = mountAssessmentApp(TASK_PATH);
    const submit = await screen.findByRole("button", { name: "Submit task" });
    const clear = clearButton();
    act(() => {
      fireEvent.click(submit);
      fireEvent.click(screen.getByRole("radio", { name: "Hallo" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "Baum" }));
      fireEvent.click(clear);
      fireEvent.click(submit);
    });
    await waitFor(() => expect(submitRequests(http)).toHaveLength(1));
    expect(answerRequests(http)).toHaveLength(0);
    expect(submit).toBeDisabled();
    expect(clear).toBeDisabled();
    for (const input of [...screen.getAllByRole("radio"), ...screen.getAllByRole("checkbox")]) expect(input).toBeDisabled();
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    await act(async () => { response.resolve(); });
    await screen.findByText("Status: Submitted");
    expect(answerRequests(http)).toHaveLength(0);
    expect(submitRequests(http)).toHaveLength(1);
  });

  it("allows independent Questions to mutate while keeping Submit blocked until every answer settles", async () => {
    const first = deferred();
    const second = deferred();
    const http = submissionHttp((config) => {
      const boolean = config.url.endsWith("question-boolean");
      return (boolean ? second : first).promise.then(() => ok(config, boolean
        ? savedAnswer("question-boolean", ["answer-stimmt"]) : savedAnswer("question-single", ["answer-hallo"])));
    });
    mountAssessmentApp(TASK_PATH);
    const submit = await screen.findByRole("button", { name: "Submit task" });
    act(() => {
      fireEvent.click(screen.getByRole("radio", { name: "Hallo" }));
      fireEvent.click(screen.getByRole("radio", { name: "Das stimmt" }));
    });
    await waitFor(() => expect(answerRequests(http)).toHaveLength(2));
    expect(submit).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Baum" })).toBeEnabled();
    await act(async () => { first.resolve(); });
    await waitFor(() => expect(screen.getByRole("radio", { name: "Hallo" })).toBeEnabled());
    expect(submit).toBeDisabled();
    await act(async () => { second.resolve(); });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(submitRequests(http)).toHaveLength(0);
  });

  it("does not serialize unrelated Tasks when another Task has a pending Answer", async () => {
    const user = userEvent.setup();
    const response = deferred();
    const otherId = "task-writing-2";
    const otherPath = `${attemptPath}/tasks/${otherId}`;
    const otherUrl = `${attemptUrl}/tasks/${otherId}/quiz-attempt`;
    const otherKey = [TASK_KEY[0], ATTEMPT_ID, otherId];
    const http = assessmentHttp((config) => {
      if (config.method === "get" && config.url === TASK_URL) return ok(config, taskRuntime());
      if (config.method === "get" && config.url === otherUrl) return ok(config, taskRuntime({ taskId: otherId, quizAttemptId: "quiz-other" }));
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      if (config.url === `${otherUrl}/submit`) return ok(config, submittedTask({ taskId: otherId, quizAttemptId: "quiz-other" }));
      return response.promise.then(() => ok(config, savedAnswer("question-single", ["answer-hallo"])));
    }, { allowTaskExecution: true, allowTaskSubmit: true });
    const { router, client } = mountAssessmentApp(TASK_PATH);
    await user.click(await screen.findByRole("radio", { name: "Hallo" }));
    await waitFor(() => expect(answerRequests(http)).toHaveLength(1));
    await act(async () => { await router.navigate(otherPath); });
    await screen.findByRole("heading", { name: "Task 2" });
    expect(screen.getByRole("button", { name: "Submit task" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Submit task" }));
    await screen.findByText("Status: Submitted");
    expect(client.getQueryData(otherKey).status).toBe("SUBMITTED");
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(client.getQueryData(TASK_KEY).questions[0].selectedAnswerIds).toEqual(["answer-hallo"]));
    expect(client.getQueryData(otherKey).status).toBe("SUBMITTED");
    expect(http.mock.calls.filter(([config]) => config.method === "post").map(([config]) => config.url))
      .toEqual([`${otherUrl}/submit`]);
  });

  it.each(["put", "delete"])("a delayed %s cannot change canonical SUBMITTED evidence from a newer GET", async (method) => {
    const user = userEvent.setup();
    const response = deferred();
    let reads = 0;
    const terminal = taskRuntime({ status: "SUBMITTED" });
    const http = submissionHttp((config) => response.promise.then(() => ok(config, method === "put"
      ? savedAnswer("question-single", ["answer-hallo"]) : clearedAnswer("question-single"))), {
      runtimeRead: (config) => ok(config, ++reads === 1 ? taskRuntime() : terminal),
    });
    const { client } = mountAssessmentApp(TASK_PATH);
    await screen.findByRole("button", { name: "Submit task" });
    await user.click(method === "put" ? screen.getByRole("radio", { name: "Hallo" }) : clearButton());
    await waitFor(() => expect(answerRequests(http)).toHaveLength(1));
    await act(async () => { await client.refetchQueries({ queryKey: TASK_KEY, exact: true }); });
    await screen.findByText("Status: Submitted");
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(client.getQueryData(TASK_KEY)).toEqual(terminal);
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(screen.getByRole("link", { name: "Continue assessment" })).toBeInTheDocument();
    expect(submitRequests(http)).toHaveLength(0);
  });
});
