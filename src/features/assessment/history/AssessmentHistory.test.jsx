import { describe, it, expect } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { loginResult } from "@/test/session-fixtures";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { withDiscoverDirection, directionUrl } from "@/test/direction-fixtures";
import { withNoActivity, nextActivityUrl } from "@/test/next-activity-fixtures";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail, ASSESSMENT_ID } from "../test/fixtures";
import { journey, journeyUrl, liveAttempt, attemptPath } from "../test/attempt-fixtures";
import { competency, COMPETENCY_URL, resultFixture } from "../test/result-fixtures";
import { resultRoute } from "../result/result-query";
import { HISTORY_PATH, HISTORY_URL, HISTORY_ATTEMPT_ID, historyKey, historyItem, historyPage } from "../test/history-fixtures";

describe("Learner Assessment History production route", () => {
  it("uses one exact read, caches validated data, and exposes only status, summary and official Result navigation", async () => {
    const page = historyPage({ items: [historyItem({
      questionResults: [{ correctAnswer: "secret-correct-answer", selectedAnswers: ["secret-selection"] }],
    })] });
    const http = assessmentHttp((config) => ok(config, page));
    const { client, router } = mountAssessmentApp(HISTORY_PATH);
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    expect(router.state.location.pathname).toBe(HISTORY_PATH);
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({
      method: "get", url: HISTORY_URL, params: { page: 0, size: 20 }, data: undefined,
      _sessionGeneration: getSessionGeneration(),
    });
    expect(client.getQueryData(historyKey())).toEqual(page);
    const region = screen.getByRole("region", { name: "Assessment History" });
    expect(within(region).getByText("Target level: B1")).toBeInTheDocument();
    expect(within(region).getByText("Status: Completed")).toBeInTheDocument();
    expect(within(region).getByText("Passed", { exact: true })).toBeInTheDocument();
    expect(within(region).getByRole("link", { name: "View result for B1 Placement Assessment" }))
      .toHaveAttribute("href", resultRoute(HISTORY_ATTEMPT_ID));
    const times = region.querySelectorAll("time");
    expect([...times].map((time) => time.dateTime)).toEqual([page.items[0].startedAt, page.items[0].expiresAt]);
    expect(region.textContent).not.toMatch(/secret-|question|correct answer|selected answer|detailed review/i);
    expect(region.textContent).not.toContain(HISTORY_ATTEMPT_ID);
    expect(region.textContent).not.toContain(ASSESSMENT_ID);
    expect(screen.getByRole("link", { name: "Back to My Learning" })).toHaveAttribute("href", "/my-learning");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it.each([
    ["COMPLETED", true, true, "Completed", "Passed"],
    ["COMPLETED", true, false, "Completed", "Not passed"],
    ["COMPLETED", false, null, "Completed", "Result not available"],
    ["EXPIRED", true, true, "Expired", "Passed"],
    ["EXPIRED", true, false, "Expired", "Not passed"],
    ["EXPIRED", false, null, "Expired", "Result not available yet"],
    ["CANCELLED", true, true, "Cancelled", "Passed"],
    ["CANCELLED", true, false, "Cancelled", "Not passed"],
    ["CANCELLED", false, null, "Cancelled", "Result not available"],
  ])("keeps status %s, availability %s and outcome %s independent", async (status, resultAvailable, passed, statusLabel, outcome) => {
    const http = assessmentHttp((config) => ok(config, historyPage({ items: [historyItem({ status, resultAvailable, passed })] })));
    mountAssessmentApp(HISTORY_PATH);
    const card = await screen.findByRole("article", { name: "B1 Placement Assessment attempt" });
    expect(within(card).getByText(`Status: ${statusLabel}`)).toBeInTheDocument();
    expect(within(card).getByText(outcome, { exact: true })).toBeInTheDocument();
    expect(within(card).queryByRole("link", { name: /View result/ }) !== null).toBe(resultAvailable);
    expect(card.textContent).not.toMatch(/failed/i);
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([HISTORY_URL]);
  });

  it("uses nullable legacy fallbacks without fabricated timestamps or deadlines", async () => {
    assessmentHttp((config) => ok(config, historyPage({ items: [historyItem({
      assessmentTitle: null, startedAt: null, expiresAt: null, resultAvailable: false, passed: null,
    })] })));
    mountAssessmentApp(HISTORY_PATH);
    const card = await screen.findByRole("article", { name: "Untitled assessment attempt" });
    expect(within(card).getByRole("heading", { name: "Untitled assessment" })).toBeInTheDocument();
    expect(card.querySelector("time")).toBeNull();
    expect(card.textContent).not.toMatch(/Started:|Deadline:|Invalid Date/);
    expect(within(card).queryByRole("link")).not.toBeInTheDocument();
  });

  it("keeps the History loading boundary and Back link independent from Journey and Result", async () => {
    const response = deferred();
    const started = deferred();
    const http = assessmentHttp((config) => {
      started.resolve();
      return response.promise.then(() => ok(config, historyPage()));
    });
    mountAssessmentApp(HISTORY_PATH);
    await act(async () => { await started.promise; });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to My Learning" })).toBeInTheDocument();
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([HISTORY_URL]);
    await act(async () => { response.resolve(); });
    await screen.findByRole("article");
  });

  it("shows meaningful empty history without Page 1 of 0", async () => {
    assessmentHttp((config) => ok(config, historyPage({ items: [], totalElements: 0, totalPages: 0 })));
    mountAssessmentApp(HISTORY_PATH);
    await screen.findByText("No assessment history");
    expect(screen.getByText("There are no past assessment attempts on this page.")).toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of 0/)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Assessment history pages" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View result/ })).not.toBeInTheDocument();
  });

  it.each([403, 404, 500])("retries History HTTP %s explicitly without navigating or reading Result", async (status) => {
    const user = userEvent.setup();
    let failed = true;
    const http = assessmentHttp((config) => failed ? fail(config, status) : ok(config, historyPage()));
    const { router } = mountAssessmentApp(HISTORY_PATH);
    await screen.findByText(status === 403 ? "Access Denied" : status === 404 ? "Resource Not Found" : "Something went wrong");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(HISTORY_PATH);
    failed = false;
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByRole("article");
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([HISTORY_URL, HISTORY_URL]);
  });

  it.each([
    ["invalid row", () => historyPage({ items: [historyItem(), historyItem({ status: "IN_PROGRESS" })], totalElements: 2 })],
    ["inconsistent Result", () => historyPage({ items: [historyItem({ resultAvailable: false })] })],
    ...["COMPLETED", "EXPIRED", "CANCELLED"].map((status) => [
      `${status} with available Result and null outcome`,
      () => historyPage({ items: [historyItem(), historyItem({ status, resultAvailable: true, passed: null })], totalElements: 2 }),
    ]),
    ["wrong page", () => historyPage({ page: 1, totalElements: 21, totalPages: 2 })],
  ])("rejects a malformed 200 %s before caching any rows and permits retry", async (_, invalid) => {
    const user = userEvent.setup();
    let failed = true;
    const http = assessmentHttp((config) => ok(config, failed ? invalid() : historyPage()));
    const { client } = mountAssessmentApp(HISTORY_PATH);
    await screen.findByText("Something went wrong");
    expect(client.getQueryState(historyKey()).error.message).toBe("The server returned an invalid assessment history response.");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(client.getQueryData(historyKey())).toBeUndefined();
    failed = false;
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByRole("article");
    expect(client.getQueryData(historyKey())).toEqual(historyPage());
    expect(http).toHaveBeenCalledTimes(2);
  });

  it("hides previous rows while fetching the next bounded page and isolates both cache entries", async () => {
    const user = userEvent.setup();
    const response = deferred();
    const nextStarted = deferred();
    const first = historyPage({ totalElements: 21, totalPages: 2 });
    const second = historyPage({ items: [historyItem({
      assessmentAttemptId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", assessmentTitle: "Earlier attempt",
    })], page: 1, totalElements: 21, totalPages: 2 });
    const http = assessmentHttp((config) => {
      if (config.params.page === 0) return ok(config, first);
      nextStarted.resolve();
      return response.promise.then(() => ok(config, second));
    });
    const { client } = mountAssessmentApp(HISTORY_PATH);
    await screen.findByText("Page 1 of 2");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await act(async () => { await nextStarted.promise; });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "B1 Placement Assessment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View result/ })).not.toBeInTheDocument();
    await act(async () => { response.resolve(); });
    await screen.findByRole("heading", { name: "Earlier attempt" });
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(client.getQueryData(historyKey())).toEqual(first);
    expect(client.getQueryData(historyKey(1))).toEqual(second);
    expect(http.mock.calls.map(([config]) => config.params)).toEqual([{ page: 0, size: 20 }, { page: 1, size: 20 }]);
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    await waitFor(() => expect(http).toHaveBeenCalledTimes(3));
    expect(http.mock.calls[2][0].params).toEqual({ page: 0, size: 20 });
  });

  it("accepts a now out-of-range page when history shrinks and permits Previous recovery", async () => {
    const user = userEvent.setup();
    let shrunk = false;
    const http = assessmentHttp((config) => {
      if (config.params.page === 1) {
        shrunk = true;
        return ok(config, historyPage({ items: [], page: 1 }));
      }
      return ok(config, historyPage(shrunk ? {} : { totalElements: 21, totalPages: 2 }));
    });
    mountAssessmentApp(HISTORY_PATH);
    await screen.findByText("Page 1 of 2");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("No assessment history");
    expect(screen.getByText("Page 2", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByText("Page 1 of 1");
    expect(http.mock.calls.map(([config]) => config.params.page)).toEqual([0, 1, 0]);
  });

  it("keeps one error boundary after a malformed refresh instead of exposing partially accepted rows", async () => {
    let valid = true;
    assessmentHttp((config) => ok(config, valid ? historyPage() : historyPage({ items: [historyItem({ passed: "true" })] })));
    const { client } = mountAssessmentApp(HISTORY_PATH);
    await screen.findByRole("article");
    valid = false;
    await act(async () => { await client.refetchQueries({ queryKey: historyKey(), exact: true }); });
    await screen.findByText("Something went wrong");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(client.getQueryData(historyKey())).toEqual(historyPage());
  });

  it.each(["loading", "empty", "failed", "active"])("keeps both dashboard entries available with %s Journey, fetching History only on click", async (state) => {
    const user = userEvent.setup();
    const pending = deferred();
    const http = assessmentHttp(withNoActivity(withDiscoverDirection((config) => {
      if (config.url === HISTORY_URL) return ok(config, historyPage());
      if (config.url === journeyUrl) {
        if (state === "loading") return pending.promise.then(() => ok(config, journey()));
        if (state === "failed") return fail(config, 500);
        return ok(config, journey(state === "active" ? [liveAttempt()] : []));
      }
      throw new Error(`Unexpected dashboard request: ${config.url}`);
    })));
    const { router, client } = mountAssessmentApp("/my-learning");
    if (state === "empty") await screen.findByText("No courses yet");
    if (state === "failed") await screen.findByText("Something went wrong");
    if (state === "active") {
      expect(await screen.findByRole("link", { name: "Continue assessment" })).toHaveAttribute("href", attemptPath);
    }
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toHaveAttribute("href", "/my-learning/assessments");
    const entry = screen.getByRole("link", { name: "Assessment History" });
    expect(entry).toHaveAttribute("href", HISTORY_PATH);
    await waitFor(() => expect(http).toHaveBeenCalledTimes(3));
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([journeyUrl, directionUrl, nextActivityUrl].sort());
    expect(client.getQueryData(historyKey())).toBeUndefined();
    await user.click(entry);
    await screen.findByRole("article");
    expect(router.state.location.pathname).toBe(HISTORY_PATH);
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([journeyUrl, directionUrl, nextActivityUrl, HISTORY_URL].sort());
    await act(async () => { pending.resolve(); });
  });

  it("opens the existing independent Result route only after the learner follows a Result link", async () => {
    const user = userEvent.setup();
    const attemptUrl = `/me/assessment-attempts/${HISTORY_ATTEMPT_ID}`;
    const page = historyPage({ items: [historyItem({ passed: false })] });
    const http = assessmentHttp((config) => {
      if (config.url === HISTORY_URL) return ok(config, page);
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      if (config.url === `${attemptUrl}/result`) return ok(config, resultFixture({ assessmentAttemptId: HISTORY_ATTEMPT_ID }));
      if (config.url === COMPETENCY_URL) return ok(config, competency());
      throw new Error(`Unexpected History/Result request: ${config.url}`);
    }, { allowResultReads: true });
    const { client, router } = mountAssessmentApp(HISTORY_PATH);
    const link = await screen.findByRole("link", { name: /View result for/ });
    expect(http).toHaveBeenCalledTimes(1);
    await user.click(link);
    await screen.findByText("Overall result: Not passed");
    expect(router.state.location.pathname).toBe(resultRoute(HISTORY_ATTEMPT_ID));
    expect(client.getQueryData(historyKey())).toEqual(page);
    expect(http.mock.calls.map(([config]) => config.url).sort())
      .toEqual([HISTORY_URL, `${attemptUrl}/assessment`, `${attemptUrl}/result`, COMPETENCY_URL].sort());
  });

  it("preserves anonymous returnTo through real login without anonymous History requests", async () => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => config.url === "/auth/login"
      ? ok(config, loginResult()) : ok(config, historyPage()));
    const { router } = mountAssessmentApp(HISTORY_PATH, { anonymous: true });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: HISTORY_PATH });
    expect(http).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Username or Email"), "learner");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
    await screen.findByRole("article");
    expect(router.state.location.pathname).toBe(HISTORY_PATH);
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(["/auth/login", HISTORY_URL]);
  });

  it("clears every cached History page on logout before login as another learner", async () => {
    const user = userEvent.setup();
    let learner = "A";
    const http = assessmentHttp((config) => {
      if (config.url === "/auth/login") {
        learner = "B";
        return ok(config, loginResult());
      }
      return ok(config, historyPage({ items: [historyItem({ assessmentTitle: `Learner ${learner} history` })] }));
    });
    const { auth, client, router } = mountAssessmentApp(HISTORY_PATH);
    await screen.findByRole("heading", { name: "Learner A history" });
    client.setQueryData(historyKey(1), historyPage({ page: 1, totalElements: 21, totalPages: 2 }));
    await act(async () => { auth.current.logout(); });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(client.getQueryData(historyKey())).toBeUndefined();
    expect(client.getQueryData(historyKey(1))).toBeUndefined();
    expect(screen.queryByText("Learner A history")).not.toBeInTheDocument();
    expect(router.state.location.state).toEqual({ returnTo: HISTORY_PATH });
    await user.type(screen.getByLabelText("Username or Email"), "learner-b");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
    await screen.findByRole("heading", { name: "Learner B history" });
    expect(client.getQueryData(historyKey()).items[0].assessmentTitle).toBe("Learner B history");
    expect(client.getQueryData(historyKey(1))).toBeUndefined();
    expect(screen.queryByText("Learner A history")).not.toBeInTheDocument();
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([HISTORY_URL, "/auth/login", HISTORY_URL]);
  });

  it.each(["success", "failure"])("fences a delayed old-account %s after session replacement", async (resolution) => {
    const oldResponse = deferred();
    const oldStarted = deferred();
    let learner = "A";
    const http = assessmentHttp((config) => {
      if (learner === "A") {
        oldStarted.resolve();
        return oldResponse.promise.then(() => resolution === "failure"
          ? fail(config, 401) : ok(config, historyPage({ items: [historyItem({ assessmentTitle: "Delayed Learner A history" })] })));
      }
      return ok(config, historyPage({ items: [historyItem({ assessmentTitle: "Learner B history" })] }));
    });
    const { auth, client } = mountAssessmentApp(HISTORY_PATH);
    await act(async () => { await oldStarted.promise; });
    const oldGeneration = getSessionGeneration();
    learner = "B";
    await act(async () => { auth.current.setSession(loginResult()); });
    await screen.findByRole("heading", { name: "Learner B history" });
    await act(async () => { oldResponse.resolve(); });
    expect(screen.queryByText("Delayed Learner A history")).not.toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    expect(auth.current.isAuthenticated).toBe(true);
    expect(auth.current.user.id).toBe("learner-b");
    expect(client.getQueryData(historyKey()).items[0].assessmentTitle).toBe("Learner B history");
    expect(http).toHaveBeenCalledTimes(2);
    expect(http.mock.calls[0][0]._sessionGeneration).toBe(oldGeneration);
    expect(http.mock.calls[1][0]._sessionGeneration).toBe(getSessionGeneration());
  });
});
