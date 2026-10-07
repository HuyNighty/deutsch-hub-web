import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { seedSession } from "@/test/session-fixtures";
import { ok } from "@/test/http";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID } from "../test/attempt-fixtures";
import { finalResult } from "../test/final-submit-fixtures";
import { competency, resultFixture, resultHttp, RESULT_URL, COMPETENCY_URL } from "../test/result-fixtures";
import { parseFinalResult, FinalSubmitResponseError } from "../attempt/final-submit-response";
import { parseAssessmentResult, parseCompetency } from "./result-response";
import { getAssessmentResult, getCompetency } from "./result.service";

const components = finalResult().componentResults;
const changedComponent = (change) => finalResult({ componentResults: [{ ...components[0], ...change }, ...components.slice(1)] });

describe("Shared official AssessmentResult validation", () => {
  it.each([
    ["null", null], ["array", []], ["primitive", "result"],
    ["blank id", finalResult({ id: " " })], ["blank attempt", finalResult({ assessmentAttemptId: "" })],
    ["wrong attempt", finalResult({ assessmentAttemptId: "other" })],
    ["UNKNOWN target", finalResult({ targetLevel: "UNKNOWN" })], ["wrong target", finalResult({ targetLevel: "A1" })],
    ["empty components", finalResult({ componentResults: [] })],
    ["null components", finalResult({ componentResults: null })], ["null component", finalResult({ componentResults: [null] })],
    ["missing component", finalResult({ componentResults: components.slice(1) })],
    ["foreign component", changedComponent({ componentId: "foreign" })],
    ["blank component", changedComponent({ componentId: " " })],
    ["duplicate component", finalResult({ componentResults: [components[0], components[0], ...components.slice(2)] })],
    ["wrong skill", changedComponent({ skillDimension: "READING" })],
    ["unknown skill", changedComponent({ skillDimension: "UNKNOWN" })],
    ...[NaN, Infinity, -1, 101, "80", null].map((performance) => [`performance ${String(performance)}`, changedComponent({ performance })]),
    ["component boolean", changedComponent({ passed: "true" })],
    ["overall boolean", finalResult({ passed: 1 })],
    ["inconsistent false", finalResult({ passed: false })], ["inconsistent true", changedComponent({ passed: false })],
  ])("both read and final Submit reject %s with distinct feature errors", (_, result) => {
    expect(() => parseAssessmentResult(result, ATTEMPT_ID, assessmentDetail())).toThrow(ApiError);
    expect(() => parseAssessmentResult(result, ATTEMPT_ID, assessmentDetail())).toThrow("invalid assessment result response");
    expect(() => parseFinalResult(result, ATTEMPT_ID, assessmentDetail())).toThrow(FinalSubmitResponseError);
    expect(() => parseFinalResult(result, ATTEMPT_ID, assessmentDetail())).toThrow("invalid assessment final submit response");
  });

  it.each(["A0", "A1", "A2", "B1", "B2", "C1", "C2"])("accepts agreed %s Result evidence independent of response order", (targetLevel) => {
    const result = resultFixture({ targetLevel });
    expect(parseAssessmentResult(result, ATTEMPT_ID, assessmentDetail({ targetLevel }))).toBe(result);
    expect(parseFinalResult(result, ATTEMPT_ID, assessmentDetail({ targetLevel }))).toBe(result);
  });

  it("calls the exact bodyless Result GET through apiClient", async () => {
    seedSession();
    const http = resultHttp();
    await expect(getAssessmentResult(ATTEMPT_ID, assessmentDetail())).resolves.toEqual(resultFixture());
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "get", url: RESULT_URL, data: undefined });
  });
});

describe("Competency contract", () => {
  it.each(["UNKNOWN", "A0", "A1", "A2", "B1", "B2", "C1", "C2"])("accepts canonical DEUTSCH %s", (currentLevel) => {
    const state = competency({ currentLevel });
    expect(parseCompetency(state)).toBe(state);
  });

  it.each([
    null, [], "competency", {}, competency({ learningDomain: "GERMAN" }), competency({ learningDomain: "ENGLISH" }),
    competency({ learningDomain: null }), competency({ currentLevel: "B3" }), competency({ currentLevel: "unknown" }),
    competency({ currentLevel: null }), competency({ currentLevel: undefined }), competency({ currentLevel: 2 }),
  ])("rejects malformed competency %# without inferring a level", (value) => {
    expect(() => parseCompetency(value)).toThrow("invalid competency response");
  });

  it("uses one exact bodyless Competency GET", async () => {
    seedSession();
    const http = resultHttp({ handler: (config) => ok(config, competency({ currentLevel: "UNKNOWN" })) });
    await expect(getCompetency()).resolves.toEqual(competency({ currentLevel: "UNKNOWN" }));
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "get", url: COMPETENCY_URL, data: undefined });
  });
});
