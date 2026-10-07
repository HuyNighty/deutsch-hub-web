import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { seedSession } from "@/test/session-fixtures";
import { ok } from "@/test/http";
import { assessmentDetail } from "../test/fixtures";
import { ATTEMPT_ID } from "../test/attempt-fixtures";
import { finalResult, finalHttp, FINAL_URL } from "../test/final-submit-fixtures";
import { finalSubmitAssessment } from "./attempt.service";
import { FinalSubmitResponseError, parseFinalResult } from "./final-submit-response";

const component = finalResult().componentResults[0];
const withComponent = (overrides) => finalResult({ componentResults: [{ ...component, ...overrides }, ...finalResult().componentResults.slice(1)] });

const malformedResults = [
  ["null", null], ["array", []], ["primitive", "result"],
  ["blank id", finalResult({ id: " " })], ["missing id", finalResult({ id: undefined })],
  ["blank attempt", finalResult({ assessmentAttemptId: " " })], ["wrong attempt", finalResult({ assessmentAttemptId: "other" })],
  ["UNKNOWN level", finalResult({ targetLevel: "UNKNOWN" })], ["wrong level", finalResult({ targetLevel: "A1" })],
  ["invalid level", finalResult({ targetLevel: "B3" })],
  ["empty components", finalResult({ componentResults: [] })], ["missing components", finalResult({ componentResults: undefined })],
  ["null component", finalResult({ componentResults: [null] })],
  ["missing component", finalResult({ componentResults: finalResult().componentResults.slice(1) })],
  ["foreign component", withComponent({ componentId: "foreign" })], ["blank component", withComponent({ componentId: " " })],
  ["duplicate component", finalResult({ componentResults: [component, component, ...finalResult().componentResults.slice(2)] })],
  ["skill mismatch", withComponent({ skillDimension: "READING" })], ["unknown skill", withComponent({ skillDimension: "UNKNOWN" })],
  ...[NaN, Infinity, -1, 101, "80", null].map((performance) => [`performance ${String(performance)}`, withComponent({ performance })]),
  ["component passed type", withComponent({ passed: "true" })], ["overall passed type", finalResult({ passed: 1 })],
  ["inconsistent overall false", finalResult({ passed: false })],
  ["inconsistent overall true", withComponent({ passed: false })],
];

describe("Final Submit response contract", () => {
  it.each(malformedResults)("rejects %s before returning a Result", async (_, result) => {
    seedSession();
    const http = finalHttp((config) => ok(config, result));
    const error = await finalSubmitAssessment(ATTEMPT_ID, assessmentDetail()).catch((error) => error);
    expect(error).toBeInstanceOf(FinalSubmitResponseError);
    expect(error).toBeInstanceOf(ApiError);
    expect(http).toHaveBeenCalledTimes(1);
  });

  it("uses one bodyless POST and accepts reordered components and valid failed outcomes", async () => {
    seedSession();
    const result = finalResult();
    result.componentResults.reverse();
    result.componentResults[0] = { ...result.componentResults[0], performance: 0, passed: false };
    result.componentResults[1].performance = 100;
    result.passed = false;
    const http = finalHttp((config) => ok(config, result));
    await expect(finalSubmitAssessment(ATTEMPT_ID, assessmentDetail())).resolves.toEqual(result);
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "post", url: FINAL_URL, data: undefined });
  });

  it.each(["A0", "A1", "A2", "B1", "B2", "C1", "C2"])("accepts agreed %s target level", (targetLevel) => {
    const result = finalResult({ targetLevel });
    expect(parseFinalResult(result, ATTEMPT_ID, assessmentDetail({ targetLevel }))).toBe(result);
  });
});
