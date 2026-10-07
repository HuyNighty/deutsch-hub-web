import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { detailPath, attemptPath, attemptUrl, startUrl, journeyUrl } from "../test/attempt-fixtures";
import { FINAL_URL } from "../test/final-submit-fixtures";
import { RESULT_URL, COMPETENCY_URL } from "../test/result-fixtures";
import { journeyServer, PARENT_KEY, DEFINITION_URL, taskUrl, taskPath, openTask, submitAndReturn, requestSequence, writes } from "./journey-fixtures";

describe("Assessment integrated entry and recovery", () => {
  it("resumes the existing active Attempt and bound Task without duplicate starts despite past browser deadlines", async () => {
    const user = userEvent.setup();
    const server = journeyServer({ active: true, bound: ["task-writing-4"] });
    const { router, client } = mountAssessmentApp(detailPath);
    await user.click(await screen.findByRole("link", { name: "Continue Assessment" }));
    await screen.findByText("Status: In progress");
    expect(screen.queryByRole("button", { name: "Start Assessment" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(client.getQueryData(PARENT_KEY)).toEqual(server.parent());
    expect(Date.parse(server.parent().expiresAt)).toBeLessThan(Date.now());
    const task = server.tasks[0];
    await openTask(user, server, task, { bound: true });
    expect(router.state.location.pathname).toBe(taskPath(task));
    expect(screen.getByRole("radio", { name: "Hallo" })).toBeEnabled();
    expect(writes(server.http)).toEqual([]);
    expect(requestSequence(server.http)).toEqual([
      ["get", detailPath.replace("/my-learning", "/me")], ["get", journeyUrl],
      ["get", attemptUrl], ["get", DEFINITION_URL], ["get", taskUrl(task)], ["get", DEFINITION_URL],
    ]);
  });

  it("recovers a Start 409 with one fresh Journey and resumes the matching Attempt without POST retry", async () => {
    const user = userEvent.setup();
    const server = journeyServer({ conflict: true });
    const { router } = mountAssessmentApp(detailPath);
    await server.clickWrite(user, await screen.findByRole("button", { name: "Start Assessment" }), "post", startUrl);
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(writes(server.http)).toEqual([["post", startUrl]]);
    expect(requestSequence(server.http)).toEqual([
      ["get", detailPath.replace("/my-learning", "/me")], ["get", journeyUrl], ["post", startUrl],
      ["get", journeyUrl], ["get", attemptUrl], ["get", DEFINITION_URL],
    ]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reconciles incomplete Final Submit once, finishes the remaining bound Task and explicitly retries settlement", async () => {
    const user = userEvent.setup();
    const definition = assessmentDetail();
    const tasks = definition.components.flatMap((item) => item.tasks);
    const remaining = tasks.at(-1);
    const server = journeyServer({ active: true, submitted: tasks.slice(0, -1).map((item) => item.taskId), bound: [remaining.taskId] });
    const { client, router } = mountAssessmentApp(attemptPath);
    await screen.findByText("Status: In progress");
    // Every Task is bound, but one child is still IN_PROGRESS: bindings are not completion evidence.
    expect(server.parent().taskAttempts).toHaveLength(tasks.length);
    expect(server.runtimes.get(remaining.taskId).status).toBe("IN_PROGRESS");
    const before = server.http.mock.calls.length;
    await server.clickWrite(user, screen.getByRole("button", { name: "Submit assessment" }), "post", FINAL_URL);
    await within(screen.getByRole("region", { name: "Assessment finalization" })).findByText("HTTP failure");
    expect(requestSequence(server.http).slice(before)).toEqual([["post", FINAL_URL], ["get", attemptUrl]]);
    expect(client.getQueryData(PARENT_KEY).status).toBe("IN_PROGRESS");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(screen.queryByText("Assessment finalized successfully.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View result" })).not.toBeInTheDocument();
    expect(writes(server.http)).toEqual([["post", FINAL_URL]]);
    await openTask(user, server, remaining, { bound: true });
    await submitAndReturn(user, server, remaining, router);
    const beforeRetry = server.http.mock.calls.length;
    await server.clickWrite(user, screen.getByRole("button", { name: "Submit assessment" }), "post", FINAL_URL);
    await screen.findByText("Assessment finalized successfully.");
    expect(requestSequence(server.http).slice(beforeRetry)).toEqual([["post", FINAL_URL], ["get", attemptUrl]]);
    expect(client.getQueryData(PARENT_KEY).status).toBe("COMPLETED");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(writes(server.http)).toEqual([["post", FINAL_URL], ["post", `${taskUrl(remaining)}/submit`], ["post", FINAL_URL]]);
    expect(server.http.mock.calls.some(([config]) => [RESULT_URL, COMPETENCY_URL].includes(config.url))).toBe(false);
  });

  it("offers a later SEQUENTIAL Task to Backend, surfaces its refusal and permits an independent component", async () => {
    const user = userEvent.setup();
    const definition = assessmentDetail();
    const later = { taskId: "task-listening-2", order: 6, quizRevisionId: "revision-listening-2" };
    definition.components[1].tasks.push(later);
    const server = journeyServer({ active: true, definition, denyTaskId: later.taskId });
    const { router } = mountAssessmentApp(attemptPath);
    await screen.findByText("Status: In progress");
    const row = screen.getByText("Task 6").closest("li");
    const start = within(row).getByRole("button", { name: "Start task" });
    expect(start).toBeEnabled();
    expect(server.parent().taskAttempts).toEqual([]);
    await server.clickWrite(user, start, "post", taskUrl(later));
    expect(await within(row).findByRole("alert")).toHaveTextContent("HTTP failure");
    expect(router.state.location.pathname).toBe(attemptPath);
    await openTask(user, server, server.tasks[0]);
    expect(router.state.location.pathname).toBe(taskPath(server.tasks[0]));
    expect(writes(server.http)).toEqual([["post", taskUrl(later)], ["post", taskUrl(server.tasks[0])]]);
  });

  it("keeps malformed final Result failure on the parent without reconciliation, child actions or result navigation", async () => {
    const user = userEvent.setup();
    const server = journeyServer({ active: true, malformedFinal: true,
      submitted: assessmentDetail().components.flatMap((item) => item.tasks.map((task) => task.taskId)) });
    const { router, client } = mountAssessmentApp(attemptPath);
    await screen.findByText("Status: In progress");
    const before = server.http.mock.calls.length;
    await server.clickWrite(user, screen.getByRole("button", { name: "Submit assessment" }), "post", FINAL_URL);
    await screen.findByText("The server returned an invalid assessment final submit response.");
    expect(requestSequence(server.http).slice(before)).toEqual([["post", FINAL_URL]]);
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(client.getQueryData(PARENT_KEY).status).toBe("IN_PROGRESS");
    expect(screen.queryByText("Assessment finalized successfully.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View result" })).not.toBeInTheDocument();
    expect(writes(server.http)).toEqual([["post", FINAL_URL]]);
  });
});
