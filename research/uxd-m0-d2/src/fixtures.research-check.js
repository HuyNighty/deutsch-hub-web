import { describe, it, expect } from "vitest";
import { fixtures } from "./fixtures";
import { surfaces, foregrounds } from "./surfaces";

describe("Approved research fixtures and surfaces", () => {
  it.each([
    ["publicHome", "A", "#F5EFE3", "#FAFAF7"],
    ["publicHome", "B", "#F5EFE3", "#EAE6D5"],
    ["exploreGermany", "A", "#E9ECE8", "#FAFAF7"],
    ["exploreGermany", "B", "#E9ECE8", "#DCE4D7"],
    ["myLearning", "A", "#F5EFE3", "#FAFAF7"],
    ["myLearning", "B", "#F5EFE3", "#EAE6D5"],
    ["assessment", "A", "#FAFAF7", "#FAFAF7"],
    ["assessment", "B", "#FAFAF7", "#FFFFFF"],
  ])("%s %s preserves the approved canvas and fill", (context, model, canvas, fill) => {
    expect(surfaces[context].canvas).toBe(canvas);
    expect(surfaces[context][model]).toBe(fill);
  });

  it("keeps both foreground candidates exact", () => {
    expect(foregrounds).toEqual({ deepForest: "#20331B", forest: "#354C2B" });
  });

  it("freezes every fixture node so comparisons cannot alter content", () => {
    function check(value) {
      if (value !== null && typeof value === "object") {
        expect(Object.isFrozen(value)).toBe(true);
        Object.values(value).forEach(check);
      }
    }
    check(fixtures);
    expect(Object.keys(fixtures)).toEqual(Object.keys(surfaces));
  });

  it("keeps the saved 3/8 progress internally consistent without inventing a rule", () => {
    const course = fixtures.myLearning.journey.courses[0];
    expect(course.enrollmentStatus).toBe("IN_PROGRESS");
    expect(course.title).toBe("Tiếng Đức A1");
    expect(course.progress).toMatchObject({ completedLessons: 3, totalLessons: 8, completionPercentage: 37.5 });
    expect(course.progress.completedLessons / course.progress.totalLessons * 100).toBe(course.progress.completionPercentage);
  });

  it("targets the same course and one incomplete eligible lesson with no active assessment priority", () => {
    const { journey, direction, nextActivity, lessonEligibility } = fixtures.myLearning;
    const course = journey.courses[0];
    expect(journey.assessmentAttempts).toEqual([]);
    expect(direction).toEqual({ type: "CONTINUE_COURSE", target: { courseId: course.courseId } });
    expect(nextActivity).toEqual({ type: "OPEN_LESSON", target: {
      courseId: course.courseId, lessonId: lessonEligibility.lessonId,
    } });
    expect(lessonEligibility.courseId).toBe(course.courseId);
    expect(lessonEligibility).toMatchObject({ eligible: true, completed: false });
    expect(lessonEligibility.completedLessonIds).toHaveLength(3);
    expect(new Set(lessonEligibility.completedLessonIds).size).toBe(3);
    expect(lessonEligibility.completedLessonIds).not.toContain(lessonEligibility.lessonId);
  });

  it("adds no unsupported fields to the next-lesson target or CourseSnapshot", () => {
    expect(Object.keys(fixtures.myLearning.nextActivity.target).sort()).toEqual(["courseId", "lessonId"]);
    expect(Object.keys(fixtures.myLearning.journey.courses[0]).sort()).toEqual([
      "courseId", "enrollmentStatus", "level", "progress", "title",
    ]);
  });

  it("keeps runtime selection separate from focus, correctness and final result", () => {
    const runtime = fixtures.assessment.runtime;
    const question = runtime.questions[0];
    expect(runtime.status).toBe("IN_PROGRESS");
    expect(runtime.submittedAt).toBeNull();
    expect(question.type).toBe("MULTIPLE_CHOICE");
    expect(question.selectedAnswerIds).toEqual([question.options[0].answerId]);
    expect(question.selectedAnswerIds).not.toContain(question.options[1].answerId);
    expect(Object.keys(question).sort()).toEqual(["content", "options", "order", "questionId", "selectedAnswerIds", "type"]);
    expect(Object.keys(fixtures.assessment)).toEqual(["runtime"]);
  });

  it("has one synthetic article and one supported public discovery concept", () => {
    expect(Object.keys(fixtures.exploreGermany)).toEqual(["article"]);
    const article = fixtures.exploreGermany.article;
    expect(article.slug).toMatch(/^research-/);
    expect(article.title).toBeTruthy();
    expect(article.summary).toBeTruthy();
    expect(article.publishedAt).toBeNull();
    expect(article.coverMediaId).toBeNull();
    expect(Object.keys(article).sort()).toEqual([
      "articleId", "coverMediaId", "primaryCategory", "publishedAt", "slug", "summary", "title", "topics", "versionId",
    ]);
    expect(fixtures.publicHome.discoveryConcept).toBe("/explore-germany");
  });
});
