import { describe, it, expect } from "vitest";
import { act, fireEvent, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { deferred, ok } from "@/test/http";
import { mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, resumedAttempt } from "../test/attempt-fixtures";
import {
  FINAL_URL, PARENT_KEY, finalResult, finalHttp, finalRequests, parentReads, seedFinalCaches,
} from "../test/final-submit-fixtures";

describe("Parent finalization", () => {
  it.each(["IN_PROGRESS", "EXPIRED", "COMPLETED", "CANCELLED", "CREATED"])("offers only authorized initial %s actions", async (status) => {
    const http = finalHttp(() => { throw new Error("No implicit writes"); }, { attempt: resumedAttempt({ status, taskAttempts: [] }) });
    mountAssessmentApp(attemptPath);
    await screen.findByRole("heading", { name: "Writing" });
    const region = screen.getByRole("region", { name: "Assessment finalization" });
    if (status === "IN_PROGRESS") {
      expect(within(region).getByRole("button", { name: "Submit assessment" })).toBeEnabled();
      expect(screen.getAllByRole("button", { name: "Start task" })).toHaveLength(5);
      expect(region.textContent).not.toMatch(/ready|eligible|all tasks|submitted/i);
    } else if (status === "EXPIRED") {
      expect(within(region).getByRole("button", { name: "Finalize expired assessment" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Start task" })).not.toBeInTheDocument();
    } else {
      expect(within(region).queryByRole("button")).not.toBeInTheDocument();
      if (status === "COMPLETED") expect(within(region).getByText("Assessment completed.")).toBeInTheDocument();
    }
    expect(finalRequests(http)).toHaveLength(0);
    expect(http).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["IN_PROGRESS", "COMPLETED"], ["IN_PROGRESS", "EXPIRED"], ["EXPIRED", "EXPIRED"],
  ])("valid %s finalization reads canonical %s once and preserves cache scope", async (initial, terminal) => {
    const response = deferred();
    const parentRefresh = deferred();
    const original = resumedAttempt({ status: initial });
    const canonical = resumedAttempt({ status: terminal });
    const result = finalResult({ passed: false });
    result.componentResults[0].passed = false;
    result.componentResults[0].performance = 37;
    let reads = 0;
    const http = finalHttp((config) => response.promise.then(() => ok(config, result)), {
      parentRead: (config) => ++reads === 1 ? ok(config, original) : parentRefresh.promise.then(() => ok(config, canonical)),
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { execution, unrelated } = seedFinalCaches(client);
    const { router } = mountAssessmentApp(attemptPath, { client });
    const button = await screen.findByRole("button", { name: initial === "EXPIRED" ? "Finalize expired assessment" : "Submit assessment" });
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    await waitFor(() => expect(finalRequests(http)).toHaveLength(1));
    expect(finalRequests(http)[0][0]).toMatchObject({ method: "post", url: FINAL_URL, data: undefined });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(client.getMutationCache().getAll().find((mutation) => mutation.state.status === "pending").options.mutationKey)
      .toEqual(["learner-assessment-final-submit", ATTEMPT_ID]);
    expect(client.getQueryData(PARENT_KEY)).toEqual(original);
    await act(async () => { response.resolve(); });
    await waitFor(() => expect(parentReads(http)).toHaveLength(2));
    expect(button).toBeDisabled();
    expect(client.getQueryData(PARENT_KEY)).toEqual(original);
    await act(async () => { parentRefresh.resolve(); });
    await screen.findByText("Assessment finalized successfully.");
    expect(screen.getByText(`Status: ${terminal === "COMPLETED" ? "Completed" : "Expired"}`)).toBeInTheDocument();
    expect(client.getQueryData(PARENT_KEY)).toEqual(canonical);
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(screen.queryByRole("button", { name: /submit assessment|finalize expired assessment/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    for (const key of execution) {
      expect(client.getQueryState(key).isInvalidated).toBe(true);
      expect(client.getQueryData(key)).toEqual({ saved: true });
    }
    for (const key of unrelated) {
      expect(client.getQueryState(key).isInvalidated).toBe(false);
      expect(client.getQueryData(key)).toEqual({ saved: true });
    }
    expect(client.getQueryState(["learner-assessment-attempt-definition", ATTEMPT_ID]).isInvalidated).toBe(false);
    expect(client.getQueryData(["learner-assessment-attempt-definition", ATTEMPT_ID])).toEqual(assessmentDetail());
    expect(screen.getByRole("region", { name: "Assessment attempt" }).textContent)
      .not.toMatch(/performance|37|passed|failed|score|current level|promotion/i);
    expect(http.mock.calls.filter(([config]) => config.method === "post")).toHaveLength(1);
    expect(http).toHaveBeenCalledTimes(4); // Two initial GETs, one POST, one canonical GET; no Task N-fetch.
  });

  it.each(["HTTP failure", "malformed parent"])("keeps valid finalization successful when parent refresh has %s", async (failure) => {
    const user = userEvent.setup();
    let reads = 0;
    const http = finalHttp((config) => ok(config, finalResult()), {
      parentRead: (config) => {
        if (++reads === 1) return ok(config, resumedAttempt());
        if (failure === "malformed parent") return ok(config, resumedAttempt({ assessmentAttemptId: "wrong" }));
        throw new AxiosError("GET failed", AxiosError.ERR_NETWORK, config);
      },
    });
    const { client } = mountAssessmentApp(attemptPath);
    const { execution } = seedFinalCaches(client);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    await screen.findByText("Assessment finalized successfully.");
    expect(client.getQueryData(PARENT_KEY)).toEqual(resumedAttempt());
    expect(screen.getByText("Status: In progress")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit assessment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    for (const key of execution) expect(client.getQueryState(key).isInvalidated).toBe(true);
    expect(finalRequests(http)).toHaveLength(1);
    expect(parentReads(http)).toHaveLength(2);
    expect(client.getMutationCache().getAll()[0].state.status).toBe("success");
  });

  it.each([
    ["null", null], ["wrong attempt", finalResult({ assessmentAttemptId: "other" })],
    ["wrong level", finalResult({ targetLevel: "A1" })], ["empty components", finalResult({ componentResults: [] })],
    ["inconsistent passed", finalResult({ passed: false })],
    ["foreign component", finalResult({ componentResults: [{ componentId: "other", skillDimension: "READING", performance: 80, passed: true }] })],
  ])("malformed successful %s preserves canonical cache without refresh or invalidation", async (_, result) => {
    const user = userEvent.setup();
    const http = finalHttp((config) => ok(config, result));
    const { client, router } = mountAssessmentApp(attemptPath);
    const { execution, unrelated } = seedFinalCaches(client);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    expect(await within(screen.getByRole("region", { name: "Assessment finalization" })).findByRole("alert"))
      .toHaveTextContent("invalid assessment final submit");
    expect(client.getQueryData(PARENT_KEY)).toEqual(resumedAttempt());
    for (const key of [...execution, ...unrelated]) expect(client.getQueryState(key).isInvalidated).toBe(false);
    expect(screen.queryByText("Assessment finalized successfully.")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(parentReads(http)).toHaveLength(1);
    expect(finalRequests(http)).toHaveLength(1);
  });

  it("treats malformed shared ApiResponse envelopes as contract errors without reconciliation", async () => {
    const user = userEvent.setup();
    const http = finalHttp((config) => ({ ...ok(config, finalResult()), data: { result: finalResult() } }));
    const { client } = mountAssessmentApp(attemptPath);
    const { execution } = seedFinalCaches(client);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    await screen.findByText("The server returned an unexpected response.");
    for (const key of execution) expect(client.getQueryState(key).isInvalidated).toBe(false);
    expect(parentReads(http)).toHaveLength(1);
    expect(finalRequests(http)).toHaveLength(1);
  });
});
