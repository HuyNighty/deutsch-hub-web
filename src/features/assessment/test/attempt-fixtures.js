import { ASSESSMENT_ID } from "./fixtures";

export const ATTEMPT_ID = "attempt-owned-42";
export const STARTED_AT = "2025-06-01T08:00:00Z";
export const EXPIRES_AT = "2025-06-01T09:00:00Z";

export function liveAttempt(overrides = {}) {
  return {
    assessmentAttemptId: ATTEMPT_ID, assessmentId: ASSESSMENT_ID, targetLevel: "B1",
    status: "IN_PROGRESS", startedAt: STARTED_AT, expiresAt: EXPIRES_AT, ...overrides,
  };
}

export function journey(assessmentAttempts = [], overrides = {}) {
  return { learningDomain: "DEUTSCH", currentLevel: "A1", courses: [], assessmentAttempts, ...overrides };
}

export function courseSnapshot(overrides = {}) {
  return {
    courseId: "course-one", title: "German Basics", level: "A1", enrollmentStatus: "IN_PROGRESS",
    progress: { completedLessons: 3, totalLessons: 8, completionPercentage: 37.5, totalStudyMinutes: 90 },
    ...overrides,
  };
}

export function startedAttempt(overrides = {}) {
  return {
    id: ATTEMPT_ID, assessmentId: ASSESSMENT_ID, userId: "learner-a",
    status: "IN_PROGRESS", startedAt: STARTED_AT, expiresAt: EXPIRES_AT,
    taskAttempts: [{ id: "task-attempt-start", taskId: "task-writing-4", quizAttemptId: null }],
    ...overrides,
  };
}

export function resumedAttempt(overrides = {}) {
  return {
    assessmentAttemptId: ATTEMPT_ID, assessmentId: ASSESSMENT_ID,
    status: "IN_PROGRESS", startedAt: STARTED_AT, expiresAt: EXPIRES_AT,
    taskAttempts: [{ taskId: "task-writing-4", quizAttemptId: "quiz-owned-42" }],
    ...overrides,
  };
}

export const detailPath = `/my-learning/assessments/${ASSESSMENT_ID}`;
export const attemptPath = `/my-learning/assessment-attempts/${ATTEMPT_ID}`;
export const attemptUrl = `/me/assessment-attempts/${ATTEMPT_ID}`;
export const startUrl = `/me/assessments/${ASSESSMENT_ID}/attempts`;
export const journeyUrl = "/me/learning-journey";
