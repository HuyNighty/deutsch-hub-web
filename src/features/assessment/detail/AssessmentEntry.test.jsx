import { seedDirection } from "@/test/direction-fixtures";
import { describe, it, expect } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail, ASSESSMENT_ID } from "../test/fixtures";
import {
  ATTEMPT_ID, journey, liveAttempt, startedAttempt, resumedAttempt,
  detailPath, attemptPath, attemptUrl, startUrl, journeyUrl,
} from "../test/attempt-fixtures";

function entryHttp(handler) {
  return assessmentHttp((config) => {
    if (config.url === `/me/assessments/${ASSESSMENT_ID}`) return ok(config, assessmentDetail());
    if (config.url === attemptUrl) return ok(config, resumedAttempt());
    if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
    return handler(config);
  }, { allowStart: true });
}

function posts(http) {
  return http.mock.calls.filter(([config]) => config.method === "post");
}

describe("Assessment entry and Start", () => {
  it("checks only after the definition succeeds; no Start flash while Journey is pending", async () => {
    const definition = deferred();
    const read = deferred();
    const http = assessmentHttp((config) => config.url === journeyUrl
      ? read.promise.then(() => ok(config, journey()))
      : definition.promise.then(() => ok(config, assessmentDetail())));
    mountAssessmentApp(detailPath);
    expect(http.mock.calls.some(([config]) => config.url === journeyUrl)).toBe(false);
    await act(async () => { definition.resolve(); });
    await screen.findByText("Checking assessment attempts...");
    expect(screen.queryByRole("button", { name: "Start Assessment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue Assessment" })).not.toBeInTheDocument();
    await act(async () => { read.resolve(); });
    await screen.findByRole("button", { name: "Start Assessment" });
    expect(screen.queryByRole("link", { name: "Continue Assessment" })).not.toBeInTheDocument();
    expect(posts(http)).toHaveLength(0);
  });

  it("continues the exactly matching live attempt without POST, ignoring browser deadline", async () => {
    const user = userEvent.setup();
    const http = entryHttp((config) => ok(config, journey([
      liveAttempt({ assessmentId: "other-assessment", assessmentAttemptId: "other-attempt" }), liveAttempt(),
    ])));
    const { router, client } = mountAssessmentApp(detailPath);
    const link = await screen.findByRole("link", { name: "Continue Assessment" });
    expect(link).toHaveAttribute("href", attemptPath);
    expect(screen.queryByRole("button", { name: "Start Assessment" })).not.toBeInTheDocument();
    expect(client.getQueryData(["learner-learning-journey"]).assessmentAttempts).toHaveLength(2);
    await user.click(link);
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(posts(http)).toHaveLength(0);
  });

  it("keeps definition visible on Journey failure, blocks Start and retries the focused read", async () => {
    const user = userEvent.setup();
    let failed = true;
    const http = entryHttp((config) => failed ? fail(config, 500) : ok(config, journey()));
    mountAssessmentApp(detailPath);
    await screen.findByText("Unable to check assessment attempts.");
    expect(screen.getByRole("heading", { name: "Writing" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start Assessment" })).not.toBeInTheDocument();
    failed = false;
    await user.click(screen.getByRole("button", { name: "Retry assessment check" }));
    await screen.findByRole("button", { name: "Start Assessment" });
    expect(http.mock.calls.filter(([config]) => config.url === journeyUrl)).toHaveLength(2);
    expect(posts(http)).toHaveLength(0);
  });

  it("starts once with no body, invalidates Journey and Direction, navigates using id and fetches canonical resume data", async () => {
    const response = deferred();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const direction = seedDirection(client);
    const courses = [{ courseId: "unrelated-course" }];
    client.setQueryData(["my-courses"], courses);
    client.setQueryData(["sentinel"], { intact: true });
    const http = entryHttp((config) => config.url === journeyUrl
      ? ok(config, journey([liveAttempt({ assessmentId: "other-assessment" })]))
      : response.promise.then(() => ok(config, startedAttempt())));
    const { router, auth } = mountAssessmentApp(detailPath, { client });
    const button = await screen.findByRole("button", { name: "Start Assessment" });
    const userId = auth.current.user.id;
    // Dispatch both interactions in the same React batch, before pending state rerenders.
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    await waitFor(() => expect(posts(http)).toHaveLength(1));
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(posts(http)[0][0]).toMatchObject({ url: startUrl, method: "post", data: undefined });
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).toBeUndefined();
    await act(async () => { response.resolve(); });
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(posts(http)).toHaveLength(1);
    direction(true);
    expect(client.getQueryState(["learner-learning-journey"]).isInvalidated).toBe(true);
    expect(client.getQueryData(["my-courses"])).toEqual(courses);
    expect(client.getQueryState(["my-courses"]).isInvalidated).toBe(false);
    expect(client.getQueryData(["sentinel"])).toEqual({ intact: true });
    expect(auth.current.user.id).toBe(userId);
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).toEqual(resumedAttempt());
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).not.toHaveProperty("id");
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([
      `/me/assessments/${ASSESSMENT_ID}`, journeyUrl, startUrl, attemptUrl, `${attemptUrl}/assessment`,
    ]);
  });

  it.each([
    ["blank id", { id: " " }],
    ["wrong status", { status: "CREATED" }],
    ["assessment mismatch", { assessmentId: "other-assessment" }],
    ["missing user", { userId: undefined }],
    ["missing start", { startedAt: null }],
    ["invalid deadline", { expiresAt: "not-a-date" }],
    ["blank task identity", { taskAttempts: [{ id: "", taskId: "task", quizAttemptId: null }] }],
  ])("rejects malformed Start %s without navigation or cache seeding", async (_, overrides) => {
    const user = userEvent.setup();
    const http = entryHttp((config) => ok(config, config.url === journeyUrl ? journey() : startedAttempt(overrides)));
    const { router, client } = mountAssessmentApp(detailPath);
    await user.click(await screen.findByRole("button", { name: "Start Assessment" }));
    await screen.findByText("The server returned an invalid assessment start response.");
    expect(router.state.location.pathname).toBe(detailPath);
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).toBeUndefined();
    expect(posts(http)).toHaveLength(1);
  });

  it.each([
    ["UNKNOWN target", liveAttempt({ targetLevel: "UNKNOWN" })],
    ["terminal snapshot", liveAttempt({ status: "EXPIRED" })],
    ["invalid timestamp", liveAttempt({ startedAt: "yesterday" })],
    ["blank identity", liveAttempt({ assessmentAttemptId: " " })],
  ])("rejects malformed Journey %s without an action decision", async (_, invalid) => {
    const http = entryHttp((config) => ok(config, journey([invalid])));
    const { client } = mountAssessmentApp(detailPath);
    await screen.findByText("Unable to check assessment attempts.");
    expect(screen.queryByRole("button", { name: "Start Assessment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue Assessment" })).not.toBeInTheDocument();
    expect(client.getQueryData(["learner-learning-journey"])).toBeUndefined();
    expect(posts(http)).toHaveLength(0);
  });
});

describe("Start conflict recovery", () => {
  it.each(["match", "no match", "read failure", "malformed fresh snapshot"])(
    "uses one fresh Journey after 409: %s", async (outcome) => {
      const user = userEvent.setup();
      let reads = 0;
      const fresh = journey([liveAttempt()]);
      const http = entryHttp((config) => {
        if (config.url === startUrl) return fail(config, 409);
        if (config.url === journeyUrl) {
          reads += 1;
          if (reads === 1 || outcome === "no match") return ok(config, journey());
          if (outcome === "read failure") return fail(config, 500);
          if (outcome === "malformed fresh snapshot") return ok(config, journey([liveAttempt({ status: "CREATED" })]));
          return ok(config, fresh);
        }
        throw new Error(`Unexpected request: ${config.url}`);
      });
      const { router, client } = mountAssessmentApp(detailPath);
      const direction = seedDirection(client);
      await user.click(await screen.findByRole("button", { name: "Start Assessment" }));
      if (outcome === "match") {
        await screen.findByText("Status: In progress");
        expect(router.state.location.pathname).toBe(attemptPath);
        expect(client.getQueryData(["learner-learning-journey"])).toEqual(fresh);
        expect(client.getQueryState(["learner-learning-journey"]).isInvalidated).toBe(false);
      } else {
        await screen.findByText("HTTP failure");
        expect(router.state.location.pathname).toBe(detailPath);
      }
      direction(outcome === "match");
      expect(reads).toBe(2);
      expect(posts(http)).toHaveLength(1);
    },
  );

  it("does not recover or retry POST on a non-409 error", async () => {
    const user = userEvent.setup();
    const http = entryHttp((config) => config.url === journeyUrl ? ok(config, journey()) : fail(config, 500));
    const { client } = mountAssessmentApp(detailPath);
    const direction = seedDirection(client);
    await user.click(await screen.findByRole("button", { name: "Start Assessment" }));
    await screen.findByText("HTTP failure");
    direction(false);
    expect(http.mock.calls.filter(([config]) => config.url === journeyUrl)).toHaveLength(1);
    expect(posts(http)).toHaveLength(1);
  });
});
