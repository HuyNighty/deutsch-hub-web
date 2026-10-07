import { describe, it, expect } from "vitest";
import { act, screen, within, waitFor, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { deferred, fail, ok } from "@/test/http";
import { loginResult } from "@/test/session-fixtures";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail, ASSESSMENT_ID } from "../test/fixtures";
import { ATTEMPT_ID, STARTED_AT, EXPIRES_AT, resumedAttempt, attemptPath, attemptUrl } from "../test/attempt-fixtures";
import { useAssessmentAttempt } from "./hooks/useAssessmentAttempt";
import { formatAttemptTimestamp } from "./attempt-presentation";

describe("owned Assessment Attempt runtime", () => {
  it("resumes an archived definition using only the two canonical GETs, presents readonly structure and hides technical IDs", async () => {
    const attempt = resumedAttempt();
    const definition = assessmentDetail();
    const http = assessmentHttp((config) => {
      if (config.url === attemptUrl) return ok(config, attempt);
      if (config.url === `${attemptUrl}/assessment`) return ok(config, definition);
      // The ACTIVE-only discovery endpoint is unavailable for this archived assessment.
      if (config.url === `/me/assessments/${ASSESSMENT_ID}`) return fail(config, 404);
      throw new Error(`Unexpected runtime request: ${config.url}`);
    });
    const { client } = mountAssessmentApp(attemptPath);
    const heading = await screen.findByRole("heading", { name: definition.title });
    const region = screen.getByRole("region", { name: "Assessment attempt" });
    expect(heading).toBeInTheDocument();
    expect(within(region).getByText("Target level: B1")).toBeInTheDocument();
    expect(within(region).getByText("Status: In progress")).toBeInTheDocument();
    const times = region.querySelectorAll("time");
    expect([...times].map((time) => time.dateTime)).toEqual([STARTED_AT, EXPIRES_AT]);
    for (const time of times) expect(time.textContent.trim()).not.toBe("");
    expect(formatAttemptTimestamp(STARTED_AT).trim()).not.toBe("");
    expect(within(region).getByText(/Started:/)).toBeInTheDocument();
    expect(within(region).getByText(/Deadline:/)).toBeInTheDocument();
    expect(within(region).getAllByRole("heading", { level: 2 }).map((el) => el.textContent))
      .toEqual(["Writing", "Listening", "Reading", "Speaking"]);
    expect(within(region).getAllByText("Execution mode: Independent")).toHaveLength(2);
    expect(within(region).getAllByText("Execution mode: Sequential")).toHaveLength(2);
    expect(within(region).getAllByRole("listitem").map((el) => el.querySelector("span").textContent))
      .toEqual(["Task 4", "Task 2", "Task 1", "Task 3", "Task 5"]);
    const identities = [ATTEMPT_ID, ASSESSMENT_ID, ...attempt.taskAttempts.flatMap((task) => [task.taskId, task.quizAttemptId]),
      ...definition.components.flatMap((component) => [component.componentId,
        ...component.tasks.flatMap((task) => [task.taskId, task.quizRevisionId])])];
    for (const identity of identities) expect(region.textContent).not.toContain(identity);
    expect(within(region).getAllByRole("button", { name: "Start task" })).toHaveLength(4);
    expect(within(region).getByRole("link", { name: "Continue task" })).toBeInTheDocument();
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([attemptUrl, `${attemptUrl}/assessment`]);
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).toEqual(attempt);
    expect(client.getQueryData(["learner-assessment-attempt-definition", ATTEMPT_ID])).toEqual(definition);
    expect(client.getQueryData(["learner-assessment", ASSESSMENT_ID])).toBeUndefined();
  });

  it.each([
    ["CREATED", "Created"], ["COMPLETED", "Completed"], ["EXPIRED", "Expired"], ["CANCELLED", "Cancelled"],
  ])("renders %s without redirect, replacement, execution or result actions", async (status, label) => {
    const http = assessmentHttp((config) => ok(config, config.url === attemptUrl
      ? resumedAttempt({ status, startedAt: null, expiresAt: null })
      : assessmentDetail({ title: null, timeLimitMinutes: null })));
    const { router } = mountAssessmentApp(attemptPath);
    await screen.findByText(`Status: ${label}`);
    expect(screen.getByRole("heading", { name: "Untitled assessment" })).toBeInTheDocument();
    expect(screen.getByText("Started: Not started")).toBeInTheDocument();
    expect(screen.getByText("Deadline: No time limit")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(within(screen.getByRole("region", { name: "Assessment attempt" })).queryByRole("button")).not.toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(2);
  });

  it.each(["attempt", "definition"])("waits for both reads when %s is pending", async (pending) => {
    const read = deferred();
    assessmentHttp((config) => {
      const isAttempt = config.url === attemptUrl;
      const result = isAttempt ? resumedAttempt() : assessmentDetail();
      return (isAttempt === (pending === "attempt")) ? read.promise.then(() => ok(config, result)) : ok(config, result);
    });
    const { client } = mountAssessmentApp(attemptPath);
    const completedKey = pending === "attempt" ? "learner-assessment-attempt-definition" : "learner-assessment-attempt";
    await waitFor(() => expect(client.getQueryData([completedKey, ATTEMPT_ID])).toBeDefined());
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Writing" })).not.toBeInTheDocument();
    await act(async () => { read.resolve(); });
    await screen.findByText("Status: In progress");
  });

  it.each([
    ["route identity", "attempt", resumedAttempt({ assessmentAttemptId: "other-attempt" })],
    ["unknown status", "attempt", resumedAttempt({ status: "UNKNOWN" })],
    ["null quiz identity", "attempt", resumedAttempt({ taskAttempts: [{ taskId: "task", quizAttemptId: null }] })],
    ["invalid timestamp", "attempt", resumedAttempt({ startedAt: "invalid" })],
    ["malformed definition", "definition", assessmentDetail({ targetLevel: "UNKNOWN" })],
    ["cross-response identity", "definition", assessmentDetail({ assessmentId: "other-assessment" })],
  ])("rejects %s without partial runtime", async (_, boundary, invalid) => {
    assessmentHttp((config) => ok(config, config.url === attemptUrl
      ? (boundary === "attempt" ? invalid : resumedAttempt())
      : (boundary === "definition" ? invalid : assessmentDetail())));
    const { router, client } = mountAssessmentApp(attemptPath);
    await screen.findByText("Something went wrong");
    expect(screen.queryByText("Status: In progress")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Writing" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(attemptPath);
    if (boundary === "attempt") expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).toBeUndefined();
  });

  it.each([["attempt", 403, "Access Denied"], ["definition", 404, "Resource Not Found"]])(
    "uses shared errors for %s %s and retains the learner session", async (boundary, status, copy) => {
      assessmentHttp((config) => {
        const isAttempt = config.url === attemptUrl;
        if (isAttempt === (boundary === "attempt")) return fail(config, status);
        return ok(config, isAttempt ? resumedAttempt() : assessmentDetail());
      });
      const { auth } = mountAssessmentApp(attemptPath);
      await screen.findByText(copy);
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(screen.queryByRole("heading", { name: "Writing" })).not.toBeInTheDocument();
    },
  );

  it("retries both reads after a failed combined boundary", async () => {
    const user = userEvent.setup();
    let failed = true;
    const http = assessmentHttp((config) => config.url === attemptUrl
      ? (failed ? fail(config, 500) : ok(config, resumedAttempt()))
      : ok(config, assessmentDetail()));
    mountAssessmentApp(attemptPath);
    await screen.findByText("Something went wrong");
    failed = false;
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByText("Status: In progress");
    expect(http).toHaveBeenCalledTimes(4);
  });

  it("does not request either read without a route ID", () => {
    const client = new QueryClient();
    const http = assessmentHttp(() => { throw new Error("Unexpected read"); });
    function Wrapper({ children }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }
    const { result } = renderHook(() => useAssessmentAttempt(undefined), { wrapper: Wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(http).not.toHaveBeenCalled();
  });

  it("uses the real protected route and Login returnTo for anonymous direct entry", async () => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => {
      if (config.url === "/auth/login") return ok(config, loginResult());
      if (config.url === attemptUrl) return ok(config, resumedAttempt());
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      throw new Error(`Unexpected request: ${config.url}`);
    });
    const { router } = mountAssessmentApp(attemptPath, { anonymous: true });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: attemptPath });
    expect(http).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Username or Email"), "learner");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(["/auth/login", attemptUrl, `${attemptUrl}/assessment`]);
  });
});
