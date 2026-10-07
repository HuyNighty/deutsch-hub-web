import { ok } from "@/test/http";
import { assessmentHttp } from "./assessment-app";
import { assessmentDetail } from "./fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl } from "./attempt-fixtures";
import { finalResult } from "./final-submit-fixtures";

export const RESULT_PATH = `${attemptPath}/result`;
export const RESULT_URL = `${attemptUrl}/result`;
export const RESULT_KEY = ["learner-assessment-result", ATTEMPT_ID];
export const COMPETENCY_URL = "/me/competency";
export const COMPETENCY_KEY = ["learner-competency"];

export function competency(overrides = {}) {
  return { learningDomain: "DEUTSCH", currentLevel: "A2", ...overrides };
}

export function resultFixture(overrides = {}) {
  const result = finalResult();
  result.componentResults[0].performance = 37.5;
  result.componentResults[1].performance = 100;
  result.componentResults[2].performance = 0;
  result.componentResults[2].passed = false;
  result.passed = false;
  result.componentResults.reverse();
  return { ...result, ...overrides };
}

export function resultHttp({ definition = assessmentDetail(), result = resultFixture(), state = competency(), handler } = {}) {
  return assessmentHttp((config) => {
    if (handler) return handler(config);
    if (config.url === `${attemptUrl}/assessment`) return ok(config, definition);
    if (config.url === RESULT_URL) return ok(config, result);
    if (config.url === COMPETENCY_URL) return ok(config, state);
    throw new Error(`Unexpected Result page request: ${config.url}`);
  }, { allowResultReads: true });
}
