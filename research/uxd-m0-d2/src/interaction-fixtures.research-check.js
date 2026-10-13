import { describe, it, expect } from "vitest";
import { fixtures } from "./fixtures";
import { returningFixtures, assessmentFixture } from "./interaction-fixtures";

describe("Returning contract fixtures", () => {
  it("reuses R1 without adding next-lesson DTO properties", () => {
    const r1 = returningFixtures.R1;
    expect(r1).toBe(fixtures.myLearning);
    expect(r1.journey.courses[0].enrollmentStatus).toBe("IN_PROGRESS");
    expect(r1.journey.courses[0].progress).toMatchObject({ completedLessons: 3, totalLessons: 8, completionPercentage: 37.5 });
    expect(r1.direction.target.courseId).toBe(r1.nextActivity.target.courseId);
    expect(Object.keys(r1.nextActivity.target).sort()).toEqual(["courseId", "lessonId"]);
    expect(r1.lessonEligibility.completedLessonIds).not.toContain(r1.nextActivity.target.lessonId);
    expect(r1.lessonEligibility).toMatchObject({ eligible: true, completed: false });
  });
  it("preserves every R2 identity and one eligible resumable child", () => {
    const r2 = returningFixtures.R2;
    const runtime = assessmentFixture.runtime;
    const parent = r2.journey.assessmentAttempts[0];
    expect(parent).toMatchObject({ assessmentAttemptId: runtime.assessmentAttemptId, status: "IN_PROGRESS", expiresAt: null });
    expect(r2.direction).toEqual({ type: "RESUME_ASSESSMENT", target: { assessmentAttemptId: parent.assessmentAttemptId } });
    expect(r2.nextActivity).toEqual({ type: "RESUME_ASSESSMENT_TASK", target: {
      assessmentAttemptId: parent.assessmentAttemptId, taskId: runtime.taskId, quizAttemptId: runtime.quizAttemptId,
    } });
    expect(r2.eligibleChildren).toHaveLength(1);
    expect(r2.eligibleChildren[0]).toEqual({ runtime, deletedAt: null });
    expect(runtime).toMatchObject({ status: "IN_PROGRESS", expiresAt: null });
  });
  it("makes R3 neutral discovery with null targets and no active resources", () => {
    const r3 = returningFixtures.R3;
    expect(r3.journey.courses).toEqual([]);
    expect(r3.journey.assessmentAttempts).toEqual([]);
    expect(r3.direction).toEqual({ type: "DISCOVER_COURSE", target: null });
    expect(r3.nextActivity).toEqual({ type: "NONE", target: null });
    expect(Object.isFrozen(r3.direction)).toBe(true);
  });
});
