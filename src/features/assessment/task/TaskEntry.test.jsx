import { seedNextActivity } from "@/test/next-activity-fixtures";
import { seedDirection } from "@/test/direction-fixtures";
import { describe, it, expect } from "vitest";
import { act, fireEvent, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl, resumedAttempt } from "../test/attempt-fixtures";
import { TASK_KEY, TASK_PATH, TASK_URL, startedTask, taskRuntime } from "../test/task-fixtures";

function entryHttp(handler, parent = resumedAttempt({ taskAttempts: [] }), definition = assessmentDetail()) {
  return assessmentHttp((config) => {
    if (config.url === attemptUrl) return ok(config, parent);
    if (config.url === `${attemptUrl}/assessment`) return ok(config, definition);
    return handler(config);
  }, { allowTaskExecution: true });
}

function taskRow(label) { return screen.getByText(label).closest("li"); }
function mutations(http) { return http.mock.calls.filter(([config]) => config.method !== "get"); }

describe("Attempt Task Start / Continue", () => {
  it("offers Start for every unbound task without guessing sequential prerequisites or reordering", async () => {
    const http = entryHttp(() => { throw new Error("No task request expected"); });
    mountAssessmentApp(attemptPath);
    await screen.findByText("Status: In progress");
    expect(screen.getAllByRole("button", { name: "Start task" })).toHaveLength(5);
    expect(within(taskRow("Task 3")).getByRole("button", { name: "Start task" })).toBeEnabled();
    expect(within(screen.getByRole("region", { name: "Assessment attempt" })).getAllByRole("listitem")
      .map((el) => el.querySelector("span").textContent))
      .toEqual(["Task 4", "Task 2", "Task 1", "Task 3", "Task 5"]);
    expect(mutations(http)).toHaveLength(0);
  });

  it("continues an exact binding directly with zero POST", async () => {
    const user = userEvent.setup();
    const http = entryHttp((config) => ok(config, taskRuntime()), resumedAttempt());
    const { router } = mountAssessmentApp(attemptPath);
    const link = await screen.findByRole("link", { name: "Continue task" });
    expect(link).toHaveAttribute("href", TASK_PATH);
    expect(within(taskRow("Task 4")).queryByRole("button", { name: "Start task" })).not.toBeInTheDocument();
    await user.click(link);
    await screen.findByRole("radio", { name: "Hallo" });
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(mutations(http)).toHaveLength(0);
    expect(http.mock.calls.some(([config]) => config.url === TASK_URL && config.method === "get")).toBe(true);
  });

  it.each(["COMPLETED", "EXPIRED", "CANCELLED"])("leaves parent %s task structure readonly", async (status) => {
    const http = entryHttp(() => { throw new Error("No task request expected"); }, resumedAttempt({ status, taskAttempts: [] }));
    mountAssessmentApp(attemptPath);
    await screen.findByRole("heading", { name: "Writing" });
    expect(screen.queryByRole("button", { name: "Start task" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue task" })).not.toBeInTheDocument();
    expect(mutations(http)).toHaveLength(0);
  });

  it("guards same-batch double Start, invalidates parent and Next Activity and GETs runtime instead of seeding the Start DTO", async () => {
    const post = deferred();
    const read = deferred();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const activity = seedNextActivity(client);
    const direction = seedDirection(client);
    client.setQueryData(["learner-learning-journey"], { assessmentAttempts: [] });
    client.setQueryData(["my-courses"], ["unchanged"]);
    const http = entryHttp((config) => config.method === "post"
      ? post.promise.then(() => ok(config, startedTask()))
      : read.promise.then(() => ok(config, taskRuntime())));
    const { router } = mountAssessmentApp(attemptPath, { client });
    await screen.findByText("Status: In progress");
    const button = within(taskRow("Task 4")).getByRole("button", { name: "Start task" });
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    await waitFor(() => expect(mutations(http)).toHaveLength(1));
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(mutations(http)[0][0]).toMatchObject({ method: "post", url: TASK_URL, data: undefined });
    expect(within(taskRow("Task 2")).getByRole("button", { name: "Start task" })).toBeEnabled();
    await act(async () => { post.resolve(); });
    await waitFor(() => expect(router.state.location.pathname).toBe(TASK_PATH));
    expect(client.getQueryData(TASK_KEY)).toBeUndefined();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(client.getQueryState(["learner-assessment-attempt", ATTEMPT_ID]).isInvalidated).toBe(true);
    activity(true);
    direction(false);
    expect(client.getQueryState(["learner-learning-journey"]).isInvalidated).toBe(false);
    expect(client.getQueryState(["my-courses"]).isInvalidated).toBe(false);
    expect(client.getQueryState(["learner-assessment-attempt-definition", ATTEMPT_ID]).isInvalidated).toBe(false);
    await act(async () => { read.resolve(); });
    await screen.findByRole("radio", { name: "Hallo" });
    expect(client.getQueryData(TASK_KEY)).toEqual(taskRuntime());
    expect(mutations(http)).toHaveLength(1);
  });

  it.each(["SUBMITTED", "EXPIRED", "CANCELLED"])("accepts Backend Start retry recovery with child %s", async (status) => {
    const user = userEvent.setup();
    const http = entryHttp((config) => ok(config, config.method === "post" ? startedTask({ status }) : taskRuntime({ status })));
    const { router, client } = mountAssessmentApp(attemptPath);
    const activity = seedNextActivity(client);
    const direction = seedDirection(client);
    await screen.findByText("Status: In progress");
    await user.click(within(taskRow("Task 4")).getByRole("button", { name: "Start task" }));
    const option = await screen.findByRole("radio", { name: "Hallo" });
    expect(option).toBeDisabled();
    activity(true);
    direction(false);
    expect(router.state.location.pathname).toBe(TASK_PATH);
    expect(mutations(http)).toHaveLength(1);
  });

  it.each([
    ["parent identity", { assessmentAttemptId: "other-parent" }],
    ["task identity", { taskId: "other-task" }],
    ["blank QuizAttempt", { quizAttemptId: " " }],
    ["status", { status: "CREATED" }],
    ["timestamp", { startedAt: null }],
  ])("rejects malformed Start %s without navigating or inventing a binding", async (_, overrides) => {
    const user = userEvent.setup();
    const http = entryHttp((config) => ok(config, startedTask(overrides)));
    const { router, client } = mountAssessmentApp(attemptPath);
    const activity = seedNextActivity(client);
    const direction = seedDirection(client);
    await screen.findByText("Status: In progress");
    await user.click(within(taskRow("Task 4")).getByRole("button", { name: "Start task" }));
    await screen.findByText("The server returned an invalid assessment task start response.");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID]).taskAttempts).toEqual([]);
    expect(client.getQueryData(TASK_KEY)).toBeUndefined();
    activity(false);
    direction(false);
    expect(mutations(http)).toHaveLength(1);
  });

  it("surfaces sequential 409 without recovery reads, another POST or automatic predecessor Start", async () => {
    const user = userEvent.setup();
    const definition = assessmentDetail();
    definition.components[2].tasks.unshift({
      taskId: "task-reading-1", order: 1, quizRevisionId: "revision-reading-1",
    });
    const http = entryHttp((config) => fail(config, 409), resumedAttempt({ taskAttempts: [] }), definition);
    const { router, client } = mountAssessmentApp(attemptPath);
    const activity = seedNextActivity(client);
    const direction = seedDirection(client);
    await screen.findByText("Status: In progress");
    await user.click(within(taskRow("Task 3")).getByRole("button", { name: "Start task" }));
    const row = taskRow("Task 3");
    expect(await within(row).findByRole("alert")).toHaveTextContent("HTTP failure");
    activity(false);
    direction(false);
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID]).taskAttempts).toEqual([]);
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([
      attemptUrl, `${attemptUrl}/assessment`, `${attemptUrl}/tasks/task-reading-3/quiz-attempt`,
    ]);
    expect(mutations(http)).toHaveLength(1);
  });
});
