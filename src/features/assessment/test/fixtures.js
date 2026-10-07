export const ASSESSMENT_ID = "7c8a6a4c-9b67-4c43-a80f-0fdf58fc16a3";

export function summary(overrides = {}) {
  return {
    assessmentId: ASSESSMENT_ID,
    title: "B1 Placement Assessment",
    status: "ACTIVE",
    targetLevel: "B1",
    timeLimitMinutes: 60,
    ...overrides,
  };
}

export function assessmentPage(overrides = {}) {
  return { items: [summary()], page: 0, size: 20, totalElements: 1, totalPages: 1, ...overrides };
}

export function assessmentDetail(overrides = {}) {
  return {
    assessmentId: ASSESSMENT_ID,
    title: "B1 Placement Assessment",
    targetLevel: "B1",
    timeLimitMinutes: 60,
    // Intentionally non-numerical collection order: the UI must preserve it.
    components: [
      {
        componentId: "component-writing",
        skillDimension: "WRITING",
        executionMode: "INDEPENDENT",
        tasks: [
          { taskId: "task-writing-4", order: 4, quizRevisionId: "revision-writing-4" },
          { taskId: "task-writing-2", order: 2, quizRevisionId: "revision-writing-2" },
        ],
      },
      {
        componentId: "component-listening",
        skillDimension: "LISTENING",
        executionMode: "SEQUENTIAL",
        tasks: [{ taskId: "task-listening-1", order: 1, quizRevisionId: "revision-listening-1" }],
      },
      {
        componentId: "component-reading",
        skillDimension: "READING",
        executionMode: "SEQUENTIAL",
        tasks: [{ taskId: "task-reading-3", order: 3, quizRevisionId: "revision-reading-3" }],
      },
      {
        componentId: "component-speaking",
        skillDimension: "SPEAKING",
        executionMode: "INDEPENDENT",
        tasks: [{ taskId: "task-speaking-5", order: 5, quizRevisionId: "revision-speaking-5" }],
      },
    ],
    ...overrides,
  };
}
