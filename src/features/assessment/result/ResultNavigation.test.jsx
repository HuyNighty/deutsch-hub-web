import { describe, it, expect } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl, resumedAttempt } from "../test/attempt-fixtures";
import { FINAL_URL, finalResult, finalHttp } from "../test/final-submit-fixtures";
import { RESULT_PATH, RESULT_URL, RESULT_KEY, COMPETENCY_URL, competency, resultFixture } from "../test/result-fixtures";

describe("Read-only View result entry", () => {
  it.each(["COMPLETED", "EXPIRED", "IN_PROGRESS", "CREATED", "CANCELLED"])("offers only authorized initial %s navigation", async (status) => {
    const http = finalHttp(() => { throw new Error("No implicit action expected"); }, { attempt: resumedAttempt({ status }) });
    mountAssessmentApp(attemptPath);
    await screen.findByRole("heading", { name: "Writing" });
    if (["COMPLETED", "EXPIRED"].includes(status)) {
      expect(screen.getByRole("link", { name: "View result" })).toHaveAttribute("href", RESULT_PATH);
      if (status === "EXPIRED") expect(screen.getByRole("button", { name: "Finalize expired assessment" })).toBeEnabled();
      else expect(screen.queryByRole("button", { name: "Submit assessment" })).not.toBeInTheDocument();
    } else expect(screen.queryByRole("link", { name: "View result" })).not.toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(2);
  });

  it.each(["COMPLETED", "EXPIRED", "refresh failure"])("valid finalization exposes View result with %s while preserving success and route", async (terminal) => {
    const user = userEvent.setup();
    let reads = 0;
    const http = finalHttp((config) => ok(config, finalResult()), {
      parentRead: (config) => {
        if (++reads === 1) return ok(config, resumedAttempt());
        if (terminal === "refresh failure") throw new AxiosError("Lost refresh", AxiosError.ERR_NETWORK, config);
        return ok(config, resumedAttempt({ status: terminal }));
      },
    });
    const { router } = mountAssessmentApp(attemptPath);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    await screen.findByText("Assessment finalized successfully.");
    expect(screen.getByRole("link", { name: "View result" })).toHaveAttribute("href", RESULT_PATH);
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(http).toHaveBeenCalledTimes(4);
  });

  it("expired Result 404 never mutates, then explicit finalization invalidates the old read and canonical level", async () => {
    const user = userEvent.setup();
    let settled = false;
    const http = assessmentHttp((config) => {
      if (config.url === attemptUrl) return ok(config, resumedAttempt({ status: "EXPIRED" }));
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      if (config.url === COMPETENCY_URL) return ok(config, competency({ currentLevel: settled ? "B2" : "A2" }));
      if (config.url === RESULT_URL) return settled ? ok(config, finalResult()) : fail(config, 404);
      if (config.url === FINAL_URL) { settled = true; return ok(config, finalResult()); }
      throw new Error(`Unexpected navigation request: ${config.url}`);
    }, { allowResultReads: true, allowFinalSubmit: true });
    const { client, auth, router } = mountAssessmentApp(attemptPath);
    const otherResult = ["learner-assessment-result", "other-attempt"];
    client.setQueryData(otherResult, { unchanged: true });
    const view = await screen.findByRole("link", { name: "View result" });
    await user.click(view);
    await screen.findByText("Assessment result is not available yet.");
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(http.mock.calls.filter(([config]) => config.method !== "get")).toHaveLength(0);
    expect(within(screen.getByRole("region", { name: "Current German level" })).getByText("A2")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Back to assessment" }));
    await user.click(await screen.findByRole("button", { name: "Finalize expired assessment" }));
    await screen.findByText("Assessment finalized successfully.");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(client.getQueryState(RESULT_KEY).isInvalidated).toBe(true);
    expect(client.getQueryState(["learner-competency"]).isInvalidated).toBe(true);
    expect(client.getQueryData(["learner-competency"])).toEqual(competency()); // No local level patch from Result.
    expect(client.getQueryState(otherResult).isInvalidated).toBe(false);
    expect(client.getQueryState(["learner-assessment-attempt-definition", ATTEMPT_ID]).isInvalidated).toBe(false);
    await user.click(screen.getByRole("link", { name: "View result" }));
    await screen.findByText("Overall result: Passed");
    await within(screen.getByRole("region", { name: "Current German level" })).findByText("B2");
    expect(http.mock.calls.filter(([config]) => config.url === RESULT_URL)).toHaveLength(2);
    expect(http.mock.calls.filter(([config]) => config.method === "post").map(([config]) => config.url)).toEqual([FINAL_URL]);
  });

  it("completed reload View result opens canonical GET evidence and Competency without any mutation", async () => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => {
      if (config.url === attemptUrl) return ok(config, resumedAttempt({ status: "COMPLETED" }));
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      return ok(config, config.url === RESULT_URL ? resultFixture() : competency());
    }, { allowResultReads: true });
    const { router } = mountAssessmentApp(attemptPath);
    await user.click(await screen.findByRole("link", { name: "View result" }));
    await screen.findByText("Overall result: Not passed");
    await waitFor(() => expect(http.mock.calls.some(([config]) => config.url === COMPETENCY_URL)).toBe(true));
    expect(router.state.location.pathname).toBe(RESULT_PATH);
    expect(http.mock.calls.filter(([config]) => config.url === attemptUrl)).toHaveLength(1);
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });
});
