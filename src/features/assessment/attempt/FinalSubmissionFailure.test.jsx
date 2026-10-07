import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, ok } from "@/test/http";
import { mountAssessmentApp } from "../test/assessment-app";
import { attemptPath, resumedAttempt } from "../test/attempt-fixtures";
import { finalResult, finalHttp, finalRequests, parentReads, PARENT_KEY, seedFinalCaches } from "../test/final-submit-fixtures";

function reject(config, status, message = "Original final submit error") {
  if (status === "network") throw new AxiosError(message, AxiosError.ERR_NETWORK, config);
  throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code: 9999, message },
  });
}

describe("Final Submit failure reconciliation", () => {
  it("keeps incomplete-task 400 editable after one fresh IN_PROGRESS read and permits only explicit retry", async () => {
    const user = userEvent.setup();
    const refresh = deferred();
    let reads = 0;
    let failed = true;
    const http = finalHttp((config) => failed ? reject(config, 400) : ok(config, finalResult()), {
      parentRead: (config) => ++reads === 1 ? ok(config, resumedAttempt())
        : refresh.promise.then(() => ok(config, resumedAttempt({ status: failed ? "IN_PROGRESS" : "COMPLETED" }))),
    });
    const { client } = mountAssessmentApp(attemptPath);
    const { execution } = seedFinalCaches(client);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    await waitFor(() => expect(reads).toBe(2));
    expect(screen.getByRole("button", { name: "Submit assessment" })).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "Start task" })) expect(button).toBeDisabled();
    await act(async () => { refresh.resolve(); });
    await screen.findByText("Original final submit error");
    expect(screen.getByRole("button", { name: "Submit assessment" })).toBeEnabled();
    for (const button of screen.getAllByRole("button", { name: "Start task" })) expect(button).toBeEnabled();
    for (const key of execution) expect(client.getQueryState(key).isInvalidated).toBe(false);
    expect(finalRequests(http)).toHaveLength(1);
    expect(parentReads(http)).toHaveLength(2);
    expect(http.mock.calls.filter(([config]) => config.method === "post")).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole("button", { name: "Submit assessment" }));
    await screen.findByText("Assessment finalized successfully.");
    expect(screen.queryByText("Original final submit error")).not.toBeInTheDocument();
    expect(finalRequests(http)).toHaveLength(2);
    expect(parentReads(http)).toHaveLength(3);
  });

  it.each([
    [404, "IN_PROGRESS"], [500, "COMPLETED"], [409, "EXPIRED"],
    ["network", "IN_PROGRESS"], ["network", "COMPLETED"], ["network", "EXPIRED"],
  ])("%s failure reads canonical %s exactly once without a second POST", async (failure, status) => {
    const user = userEvent.setup();
    let reads = 0;
    const canonical = resumedAttempt({ status });
    const http = finalHttp((config) => reject(config, failure), {
      parentRead: (config) => ok(config, ++reads === 1 ? resumedAttempt() : canonical),
    });
    const { client, router } = mountAssessmentApp(attemptPath);
    const { execution, unrelated } = seedFinalCaches(client);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    await waitFor(() => expect(client.isMutating()).toBe(0));
    if (status === "IN_PROGRESS") {
      await screen.findByText(failure === "network" ? "Unable to reach the server. Please check your connection." : "Original final submit error");
      expect(screen.getByRole("button", { name: "Submit assessment" })).toBeEnabled();
    } else {
      await screen.findByText(`Status: ${status === "COMPLETED" ? "Completed" : "Expired"}`);
      expect(screen.queryByRole("button", { name: "Submit assessment" })).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      if (status === "EXPIRED") expect(screen.getByRole("button", { name: "Finalize expired assessment" })).toBeEnabled();
      else expect(screen.queryByRole("button", { name: "Finalize expired assessment" })).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Assessment finalized successfully.")).not.toBeInTheDocument();
    expect(client.getQueryData(PARENT_KEY)).toEqual(canonical);
    for (const key of execution) expect(client.getQueryState(key).isInvalidated).toBe(status !== "IN_PROGRESS");
    for (const key of unrelated) expect(client.getQueryState(key).isInvalidated).toBe(false);
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(finalRequests(http)).toHaveLength(1);
    expect(parentReads(http)).toHaveLength(2);
    expect(http.mock.calls.filter(([config]) => config.method === "post")).toHaveLength(1);
    expect(http).toHaveBeenCalledTimes(4);
  });

  it.each(["HTTP failure", "malformed parent"])("preserves original submit error and snapshot when reconciliation has %s", async (failure) => {
    const user = userEvent.setup();
    let reads = 0;
    const http = finalHttp((config) => reject(config, 400), {
      parentRead: (config) => {
        if (++reads === 1) return ok(config, resumedAttempt());
        return failure === "HTTP failure" ? reject(config, 500, "Refresh failure")
          : ok(config, resumedAttempt({ assessmentAttemptId: "wrong" }));
      },
    });
    const { client } = mountAssessmentApp(attemptPath);
    const { execution } = seedFinalCaches(client);
    await user.click(await screen.findByRole("button", { name: "Submit assessment" }));
    await screen.findByText("Original final submit error");
    expect(screen.queryByText("Refresh failure")).not.toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    expect(client.getQueryData(PARENT_KEY)).toEqual(resumedAttempt());
    expect(screen.getByRole("button", { name: "Submit assessment" })).toBeEnabled();
    for (const key of execution) expect(client.getQueryState(key).isInvalidated).toBe(false);
    expect(finalRequests(http)).toHaveLength(1);
    expect(parentReads(http)).toHaveLength(2);
  });

  it("retains a focused error for an unsuccessful explicit EXPIRED finalization", async () => {
    const user = userEvent.setup();
    const http = finalHttp((config) => reject(config, 500), { attempt: resumedAttempt({ status: "EXPIRED" }) });
    mountAssessmentApp(attemptPath);
    await user.click(await screen.findByRole("button", { name: "Finalize expired assessment" }));
    await screen.findByText("Original final submit error");
    expect(screen.getByRole("button", { name: "Finalize expired assessment" })).toBeEnabled();
    expect(screen.queryByText("Assessment finalized successfully.")).not.toBeInTheDocument();
    expect(finalRequests(http)).toHaveLength(1);
    expect(parentReads(http)).toHaveLength(2);
  });
});
