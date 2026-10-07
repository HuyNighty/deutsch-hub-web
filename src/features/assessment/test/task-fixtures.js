import { ATTEMPT_ID, attemptPath, attemptUrl, STARTED_AT } from "./attempt-fixtures";

export const TASK_ID = "task-writing-4";
export const TASK_PATH = `${attemptPath}/tasks/${TASK_ID}`;
export const TASK_URL = `${attemptUrl}/tasks/${TASK_ID}/quiz-attempt`;
export const TASK_KEY = ["learner-assessment-task-quiz", ATTEMPT_ID, TASK_ID];
export const TASK_DEADLINE = "2025-06-01T08:30:00Z";
export const SUBMITTED_AT = "2025-06-01T08:20:00Z";
export const TASK_SUBMIT_URL = `${TASK_URL}/submit`;

export function submittedTask(overrides = {}) {
  return { assessmentAttemptId: ATTEMPT_ID, taskId: TASK_ID, quizAttemptId: "quiz-owned-42",
    status: "SUBMITTED", submittedAt: SUBMITTED_AT, ...overrides };
}

export function startedTask(overrides = {}) {
  return {
    assessmentAttemptId: ATTEMPT_ID, taskId: TASK_ID, quizAttemptId: "quiz-owned-42",
    quizId: "quiz-writing", quizRevisionId: "revision-writing-4", status: "IN_PROGRESS",
    startedAt: STARTED_AT, expiresAt: TASK_DEADLINE, ...overrides,
  };
}

export function taskRuntime(overrides = {}) {
  return {
    ...startedTask(), submittedAt: overrides.status === "SUBMITTED" ? SUBMITTED_AT : null,
    // Deliberately unusual collection order; the UI must not sort.
    questions: [
      { questionId: "question-single", content: "Choose a greeting.", type: "SINGLE_CHOICE", order: 3,
        options: [
          { answerId: "answer-guten-tag", content: "Guten Tag", order: 2 },
          { answerId: "answer-hallo", content: "Hallo", order: 1 },
        ], selectedAnswerIds: ["answer-guten-tag"] },
      { questionId: "question-multiple", content: "Choose the nouns.", type: "MULTIPLE_CHOICE", order: 1,
        options: [
          { answerId: "answer-haus", content: "Haus", order: 3 },
          { answerId: "answer-baum", content: "Baum", order: 1 },
          { answerId: "answer-schnell", content: "schnell", order: 2 },
        ], selectedAnswerIds: ["answer-haus"] },
      { questionId: "question-boolean", content: "Berlin liegt in Deutschland.", type: "TRUE_FALSE", order: 2,
        options: [
          { answerId: "answer-stimmt", content: "Das stimmt", order: 2 },
          { answerId: "answer-stimmt-nicht", content: "Das stimmt nicht", order: 1 },
        ], selectedAnswerIds: [] },
    ], ...overrides,
  };
}

export function savedAnswer(questionId, selectedAnswerIds, overrides = {}) {
  return { assessmentAttemptId: ATTEMPT_ID, taskId: TASK_ID, quizAttemptId: "quiz-owned-42",
    questionId, selectedAnswerIds, status: "IN_PROGRESS", ...overrides };
}

export function clearedAnswer(questionId, overrides = {}) {
  return { assessmentAttemptId: ATTEMPT_ID, taskId: TASK_ID, quizAttemptId: "quiz-owned-42",
    questionId, status: "IN_PROGRESS", ...overrides };
}
