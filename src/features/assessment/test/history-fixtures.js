import { ASSESSMENT_ID } from "./fixtures";

export const HISTORY_PATH = "/my-learning/assessment-history";
export const HISTORY_URL = "/me/assessment-attempts/history";
export const HISTORY_ATTEMPT_ID = "bf703260-b332-4a4b-a3ba-9b9048996ac5";
export const historyKey = (page = 0) => ["learner-assessment-history", { page, size: 20 }];

export function historyItem(overrides = {}) {
  return {
    assessmentAttemptId: HISTORY_ATTEMPT_ID,
    assessmentId: ASSESSMENT_ID,
    assessmentTitle: "B1 Placement Assessment",
    targetLevel: "B1",
    status: "COMPLETED",
    startedAt: "2026-10-09T12:00:00Z",
    expiresAt: "2026-10-09T13:00:00Z",
    resultAvailable: true,
    passed: true,
    ...overrides,
  };
}

export function historyPage(overrides = {}) {
  return { items: [historyItem()], page: 0, size: 20, totalElements: 1, totalPages: 1, ...overrides };
}
