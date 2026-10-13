import { fixtures } from "./fixtures";

function freeze(value) {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const assessmentFixture = fixtures.assessment;
const runtime = assessmentFixture.runtime;
const attempt = {
  assessmentAttemptId: runtime.assessmentAttemptId,
  assessmentId: "60000000-0000-4000-8000-000000000001",
  targetLevel: "A1",
  status: "IN_PROGRESS",
  startedAt: runtime.startedAt,
  expiresAt: null,
};

export const returningFixtures = freeze({
  R1: fixtures.myLearning,
  R2: {
    journey: { learningDomain: "DEUTSCH", currentLevel: "A1", courses: [], assessmentAttempts: [attempt] },
    direction: { type: "RESUME_ASSESSMENT", target: { assessmentAttemptId: attempt.assessmentAttemptId } },
    nextActivity: { type: "RESUME_ASSESSMENT_TASK", target: {
      assessmentAttemptId: runtime.assessmentAttemptId, taskId: runtime.taskId, quizAttemptId: runtime.quizAttemptId,
    } },
    // Research evidence of exactly one eligible child, separate from response DTOs.
    eligibleChildren: [{ runtime, deletedAt: null }],
  },
  R3: {
    journey: { learningDomain: "DEUTSCH", currentLevel: "UNKNOWN", courses: [], assessmentAttempts: [] },
    direction: { type: "DISCOVER_COURSE", target: null },
    nextActivity: { type: "NONE", target: null },
  },
});

export const scenarioLabels = Object.freeze({ R1: "R1 — Khóa học đang học", R2: "R2 — Bài đánh giá đang thực hiện", R3: "R3 — Chưa có hoạt động đang thực hiện" });
