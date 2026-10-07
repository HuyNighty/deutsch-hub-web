import { assessmentDetail } from "./fixtures";
import { ATTEMPT_ID, attemptUrl, resumedAttempt } from "./attempt-fixtures";
import { assessmentHttp } from "./assessment-app";
import { ok } from "@/test/http";

export const PARENT_KEY = ["learner-assessment-attempt", ATTEMPT_ID];
export const FINAL_URL = `${attemptUrl}/submit`;

export function finalResult(overrides = {}) {
  return {
    id: "result-official-42", assessmentAttemptId: ATTEMPT_ID, targetLevel: "B1",
    componentResults: assessmentDetail().components.map((component) => ({
      componentId: component.componentId, skillDimension: component.skillDimension, performance: 80, passed: true,
    })),
    passed: true, ...overrides,
  };
}

export function finalHttp(handler, { attempt = resumedAttempt(), definition = assessmentDetail(), parentRead, ...options } = {}) {
  return assessmentHttp((config) => {
    if (config.method === "get" && config.url === attemptUrl) return parentRead ? parentRead(config) : ok(config, attempt);
    if (config.method === "get" && config.url === `${attemptUrl}/assessment`) return ok(config, definition);
    return handler(config);
  }, { allowFinalSubmit: true, ...options });
}

export const finalRequests = (http) => http.mock.calls.filter(([config]) => config.url === FINAL_URL);
export const parentReads = (http) => http.mock.calls.filter(([config]) => config.method === "get" && config.url === attemptUrl);

export function seedFinalCaches(client) {
  const execution = [
    ["learner-assessment-result", ATTEMPT_ID], ["learner-competency"],
    ["learner-learning-journey"],
    ["learner-assessment-task-quiz", ATTEMPT_ID, "task-writing-4"],
    ["learner-assessment-task-quiz", ATTEMPT_ID, "task-writing-2"],
  ];
  const unrelated = [
    ["learner-assessment-result", "other-attempt"],
    ["learner-assessment-result", ATTEMPT_ID, "unrelated-suffix"], ["learner-competency", "unrelated-suffix"],
    ["learner-assessment-task-quiz", "other-attempt", "task-writing-4"],
    ["learner-assessment-attempt", "other-attempt"],
    ["learner-learning-journey", "unrelated-suffix"],
    ["my-courses"], ["content"], ["learner-assessments"], ["account"], ["sentinel"],
  ];
  for (const key of [...execution, ...unrelated]) client.setQueryData(key, { saved: true });
  return { execution, unrelated };
}
