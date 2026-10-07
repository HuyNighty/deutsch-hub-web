import { describe, it, expect } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { attemptUrl } from "../test/attempt-fixtures";
import { finalResult } from "../test/final-submit-fixtures";
import {
  RESULT_PATH, RESULT_URL, RESULT_KEY, COMPETENCY_URL, competency, resultFixture, resultHttp,
} from "../test/result-fixtures";

describe("Independent Result and Competency failures", () => {
  it.each([404, 500])( "Result %s preserves valid competency and retries only Result GET", async (status) => {
    const user = userEvent.setup();
    let failed = true;
    const http = resultHttp({ handler: (config) => {
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      if (config.url === COMPETENCY_URL) return ok(config, competency());
      return failed ? fail(config, status) : ok(config, resultFixture());
    } });
    const { auth, client } = mountAssessmentApp(RESULT_PATH);
    const evidence = await screen.findByRole("region", { name: "Assessment result" });
    const alert = await within(evidence).findByRole("alert");
    if (status === 404) expect(alert).toHaveTextContent("Assessment result is not available yet.");
    expect(await within(screen.getByRole("region", { name: "Current German level" })).findByText("A2")).toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(screen.queryByText(/Overall result:/)).not.toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(3);
    expect(client.getQueryData(RESULT_KEY)).toBeUndefined();
    failed = false;
    await user.click(within(evidence).getByRole("button", { name: "Retry result" }));
    await within(evidence).findByText("Overall result: Not passed");
    expect(http.mock.calls.filter(([config]) => config.url === RESULT_URL)).toHaveLength(2);
    expect(http.mock.calls.filter(([config]) => config.url === COMPETENCY_URL)).toHaveLength(1);
    expect(http.mock.calls.filter(([config]) => config.url === `${attemptUrl}/assessment`)).toHaveLength(1);
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });

  it("Competency 500 leaves valid evidence visible and retries only the Current Level GET", async () => {
    const user = userEvent.setup();
    let failed = true;
    const http = resultHttp({ handler: (config) => {
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      if (config.url === RESULT_URL) return ok(config, resultFixture());
      return failed ? fail(config, 500) : ok(config, competency({ currentLevel: "B2" }));
    } });
    mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Overall result: Not passed");
    const state = screen.getByRole("region", { name: "Current German level" });
    expect(await within(state).findByRole("alert")).toHaveTextContent("Unable to load current German level");
    expect(screen.getByText("Performance: 37.5%")).toBeInTheDocument();
    failed = false;
    await user.click(within(state).getByRole("button", { name: "Retry current level" }));
    await within(state).findByText("B2");
    expect(http.mock.calls.filter(([config]) => config.url === COMPETENCY_URL)).toHaveLength(2);
    expect(http.mock.calls.filter(([config]) => config.url === RESULT_URL)).toHaveLength(1);
    expect(http.mock.calls.filter(([config]) => config.url === `${attemptUrl}/assessment`)).toHaveLength(1);
  });

  it("valid evidence renders while Competency is still pending", async () => {
    const read = deferred();
    resultHttp({ handler: (config) => config.url === COMPETENCY_URL ? read.promise.then(() => ok(config, competency()))
      : ok(config, config.url === RESULT_URL ? resultFixture() : assessmentDetail()) });
    mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Overall result: Not passed");
    expect(within(screen.getByRole("region", { name: "Current German level" })).getByRole("status"))
      .toHaveTextContent("Loading current German level");
    await act(async () => { read.resolve(); });
    await within(screen.getByRole("region", { name: "Current German level" })).findByText("A2");
  });

  it("valid Competency renders while Result is still pending", async () => {
    const read = deferred();
    resultHttp({ handler: (config) => config.url === RESULT_URL ? read.promise.then(() => ok(config, resultFixture()))
      : ok(config, config.url === COMPETENCY_URL ? competency() : assessmentDetail()) });
    mountAssessmentApp(RESULT_PATH);
    await within(screen.getByRole("region", { name: "Current German level" })).findByText("A2");
    expect(await screen.findByText("Loading assessment result...")).toBeInTheDocument();
    await act(async () => { read.resolve(); });
    await screen.findByText("Overall result: Not passed");
  });

  it.each([
    ["wrong Attempt", finalResult({ assessmentAttemptId: "wrong" })],
    ["wrong target", finalResult({ targetLevel: "A1" })],
    ["missing components", finalResult({ componentResults: finalResult().componentResults.slice(1) })],
    ["duplicate components", finalResult({ componentResults: Array(4).fill(finalResult().componentResults[0]) })],
    ["wrong skill", finalResult({ componentResults: finalResult().componentResults.map((component) => ({ ...component, skillDimension: "READING" })) })],
    ["invalid percentage", finalResult({ componentResults: finalResult().componentResults.map((component) => ({ ...component, performance: 101 })) })],
    ["inconsistent pass", finalResult({ passed: false })],
  ])("rejects %s with a Result-specific error and no partial evidence", async (_, result) => {
    const http = resultHttp({ result });
    const { client } = mountAssessmentApp(RESULT_PATH);
    const evidence = await screen.findByRole("region", { name: "Assessment result" });
    expect(await within(evidence).findByRole("alert")).toHaveTextContent("invalid assessment result response");
    expect(evidence.textContent).not.toContain("final submit");
    expect(screen.queryByText(/Overall result:|Performance:/)).not.toBeInTheDocument();
    expect(client.getQueryData(RESULT_KEY)).toBeUndefined();
    expect(await within(screen.getByRole("region", { name: "Current German level" })).findByText("A2")).toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(3);
  });

  it.each([competency({ learningDomain: "GERMAN" }), competency({ currentLevel: "INVALID" })])(
    "malformed competency %# never substitutes the Result target level", async (state) => {
      resultHttp({ state });
      mountAssessmentApp(RESULT_PATH);
      await screen.findByText("Overall result: Not passed");
      const section = screen.getByRole("region", { name: "Current German level" });
      expect(await within(section).findByRole("alert")).toHaveTextContent("invalid competency response");
      expect(within(section).queryByText("B1")).not.toBeInTheDocument();
      expect(within(section).queryByText("A0")).not.toBeInTheDocument();
    },
  );

  it("a definition failure blocks Result GET and uses page-context retry without retrying Competency", async () => {
    const user = userEvent.setup();
    let failed = true;
    const http = resultHttp({ handler: (config) => {
      if (config.url === `${attemptUrl}/assessment`) return failed ? fail(config, 500) : ok(config, assessmentDetail());
      return ok(config, config.url === COMPETENCY_URL ? competency() : resultFixture());
    } });
    mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Something went wrong");
    expect(screen.queryByRole("region", { name: "Assessment result" })).not.toBeInTheDocument();
    expect(http.mock.calls.some(([config]) => config.url === RESULT_URL)).toBe(false);
    failed = false;
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByText("Overall result: Not passed");
    expect(http.mock.calls.filter(([config]) => config.url === `${attemptUrl}/assessment`)).toHaveLength(2);
    expect(http.mock.calls.filter(([config]) => config.url === COMPETENCY_URL)).toHaveLength(1);
    expect(http.mock.calls.filter(([config]) => config.url === RESULT_URL)).toHaveLength(1);
  });

  it("rejects malformed definition before requesting Result", async () => {
    const http = resultHttp({ definition: assessmentDetail({ targetLevel: "UNKNOWN" }) });
    mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Something went wrong");
    await waitFor(() => expect(http).toHaveBeenCalledTimes(2));
    expect(http.mock.calls.some(([config]) => config.url === RESULT_URL)).toBe(false);
    expect(screen.queryByText(/Overall result:/)).not.toBeInTheDocument();
  });
});
