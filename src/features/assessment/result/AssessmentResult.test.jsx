import { describe, it, expect } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, ok } from "@/test/http";
import { loginResult } from "@/test/session-fixtures";
import { mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl } from "../test/attempt-fixtures";
import { finalResult } from "../test/final-submit-fixtures";
import {
  RESULT_PATH, RESULT_URL, RESULT_KEY, COMPETENCY_URL, COMPETENCY_KEY, competency, resultFixture, resultHttp,
} from "../test/result-fixtures";

describe("Learner Result and current German level", () => {
  it("loads only the stable definition, Result and Competency, renders immutable evidence in definition order", async () => {
    const http = resultHttp();
    const { client, router } = mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Overall result: Not passed");
    const evidence = screen.getByRole("region", { name: "Assessment result" });
    expect(screen.getByRole("heading", { name: "B1 Placement Assessment" })).toBeInTheDocument();
    expect(within(evidence).getByText("Assessment target: B1")).toBeInTheDocument();
    expect(within(evidence).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent))
      .toEqual(["Writing", "Listening", "Reading", "Speaking"]);
    const values = [["Writing", "37.5%", "Passed"], ["Listening", "100%", "Passed"], ["Reading", "0%", "Not passed"], ["Speaking", "80%", "Passed"]];
    for (const [skill, performance, outcome] of values) {
      const card = screen.getByRole("article", { name: `${skill} result` });
      expect(within(card).getByText(`Performance: ${performance}`)).toBeInTheDocument();
      expect(within(card).getByText(`Result: ${outcome}`)).toBeInTheDocument();
    }
    expect(await within(screen.getByRole("region", { name: "Current German level" })).findByText("A2")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(RESULT_PATH);
    expect(screen.getByRole("link", { name: "Back to assessment" })).toHaveAttribute("href", attemptPath);
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([`${attemptUrl}/assessment`, RESULT_URL, COMPETENCY_URL].sort());
    for (const [config] of http.mock.calls) expect(config).toMatchObject({ method: "get", data: undefined });
    expect(client.getQueryData(RESULT_KEY)).toEqual(resultFixture());
    expect(client.getQueryData(COMPETENCY_KEY)).toEqual(competency());
    expect(client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).toBeUndefined();
    expect(client.getQueryData(["learner-assessment-attempt-definition", ATTEMPT_ID])).toEqual(assessmentDetail());
    const page = screen.getByRole("region", { name: "Assessment result page" });
    for (const id of [ATTEMPT_ID, "result-official-42", ...assessmentDetail().components.map((item) => item.componentId)]) expect(page.textContent).not.toContain(id);
    expect(page.textContent).not.toMatch(/achieved|promot|new level|earned|correct answer|incorrect|question|raw score|next activity|recommend/i);
    expect(within(page).queryByRole("button")).not.toBeInTheDocument();
    expect(within(page).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it.each([
    ["B1", false, "A2", "A2"], ["B1", true, "B2", "B2"],
    ["A1", false, "UNKNOWN", "Not established yet"], ["B1", true, "B1", "B1"],
    ["B1", false, "B2", "B2"],
  ])("keeps target %s, passed %s and current level %s independent", async (targetLevel, passed, currentLevel, copy) => {
    resultHttp({ definition: assessmentDetail({ targetLevel }), result: passed ? finalResult({ targetLevel }) : resultFixture({ targetLevel }),
      state: competency({ currentLevel }) });
    mountAssessmentApp(RESULT_PATH);
    await screen.findByText(`Overall result: ${passed ? "Passed" : "Not passed"}`);
    expect(screen.getByText(`Assessment target: ${targetLevel}`)).toBeInTheDocument();
    expect(await within(screen.getByRole("region", { name: "Current German level" })).findByText(copy)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Assessment result page" }).textContent).not.toMatch(/UNKNOWN|promot|new level|achieved|became|earned/);
  });

  it("waits for the stable definition before fetching Result while Competency loads independently", async () => {
    const response = deferred();
    const http = resultHttp({ handler: (config) => {
      if (config.url === `${attemptUrl}/assessment`) return response.promise.then(() => ok(config, assessmentDetail()));
      return ok(config, config.url === COMPETENCY_URL ? competency() : resultFixture());
    } });
    mountAssessmentApp(RESULT_PATH);
    expect(await within(screen.getByRole("region", { name: "Current German level" })).findByText("A2")).toBeInTheDocument();
    expect(http.mock.calls.some(([config]) => config.url === RESULT_URL)).toBe(false);
    expect(screen.queryByText(/Overall result:/)).not.toBeInTheDocument();
    await act(async () => { response.resolve(); });
    await screen.findByText("Overall result: Not passed");
    expect(http).toHaveBeenCalledTimes(3);
  });

  it("uses the protected Result returnTo through real login without anonymous API reads", async () => {
    const user = userEvent.setup();
    const http = resultHttp({ handler: (config) => {
      if (config.url === "/auth/login") return ok(config, loginResult());
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      return ok(config, config.url === RESULT_URL ? resultFixture() : competency());
    } });
    const { router } = mountAssessmentApp(RESULT_PATH, { anonymous: true });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: RESULT_PATH });
    expect(http).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Username or Email"), "learner");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
    await screen.findByText("Overall result: Not passed");
    await waitFor(() => expect(http).toHaveBeenCalledTimes(4));
    expect(router.state.location.pathname).toBe(RESULT_PATH);
  });
});
