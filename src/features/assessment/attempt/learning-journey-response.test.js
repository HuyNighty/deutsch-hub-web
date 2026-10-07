import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { journey, courseSnapshot, liveAttempt } from "../test/attempt-fixtures";
import { parseLearningJourney } from "./attempt-response";

const snapshot = (overrides = {}) => journey([liveAttempt()], { courses: [courseSnapshot()], ...overrides });

describe("Canonical complete Learning Journey response", () => {
  it.each(["UNKNOWN", "A0", "A1", "A2", "B1", "B2", "C1", "C2"])("accepts DEUTSCH current level %s with nested Courses and active Attempts", (currentLevel) => {
    const value = snapshot({ currentLevel });
    value.courses.push(courseSnapshot({ courseId: "course-two", enrollmentStatus: "ENROLLED" }));
    expect(parseLearningJourney(value)).toBe(value);
    expect(value.currentLevel).toBe(currentLevel);
  });

  it("accepts empty collections and zero progress without inventing cardinality or percentage calculations", () => {
    expect(parseLearningJourney(journey())).toEqual(journey());
    const value = snapshot({ courses: [courseSnapshot({ progress: {
      completedLessons: 0, totalLessons: 0, completionPercentage: 0, totalStudyMinutes: 0,
    } })] });
    expect(parseLearningJourney(value)).toBe(value);
    value.courses[0].progress = { completedLessons: 2, totalLessons: 10, completionPercentage: 73.25, totalStudyMinutes: 1 };
    expect(parseLearningJourney(value).courses[0].progress.completionPercentage).toBe(73.25);
    value.courses[0].progress.completionPercentage = 100;
    expect(parseLearningJourney(value)).toBe(value);
  });

  it.each(["A1", "Starter course", "", "  Backend level  "])("preserves Course level string %j without interpreting it as CurrentLevel", (level) => {
    const value = snapshot({ currentLevel: "UNKNOWN", courses: [courseSnapshot({ level })] });
    expect(parseLearningJourney(value).courses[0].level).toBe(level);
    expect(value.currentLevel).toBe("UNKNOWN");
  });

  it.each([
    ["null", null], ["array", []], ["primitive", "journey"],
    ["missing domain", snapshot({ learningDomain: undefined })],
    ["GERMAN domain", snapshot({ learningDomain: "GERMAN" })],
    ["wrong domain", snapshot({ learningDomain: "ENGLISH" })],
    ["missing current level", snapshot({ currentLevel: undefined })],
    ["null current level", snapshot({ currentLevel: null })],
    ["invalid current level", snapshot({ currentLevel: "A3" })],
    ["missing Courses", snapshot({ courses: undefined })],
    ["null Courses", snapshot({ courses: null })],
    ["object Courses", snapshot({ courses: {} })],
    ["legacy unconsumed Courses", snapshot({ courses: "unconsumed" })],
    ["missing Attempts", snapshot({ assessmentAttempts: undefined })],
    ["nonarray Attempts", snapshot({ assessmentAttempts: {} })],
    ["malformed active Attempt", snapshot({ assessmentAttempts: [liveAttempt({ assessmentId: " " })] })],
    ["terminal Attempt", snapshot({ assessmentAttempts: [liveAttempt({ status: "EXPIRED" })] })],
    ["UNKNOWN target", snapshot({ assessmentAttempts: [liveAttempt({ targetLevel: "UNKNOWN" })] })],
  ])("rejects whole snapshot for %s", (_, value) => {
    expect(() => parseLearningJourney(value)).toThrow(ApiError);
    expect(() => parseLearningJourney(value)).toThrow("The server returned an invalid learning journey response.");
  });

  it.each([
    ["null Course", null], ["array Course", []],
    ["missing courseId", courseSnapshot({ courseId: undefined })],
    ["blank courseId", courseSnapshot({ courseId: " " })],
    ["synthetic id only", courseSnapshot({ courseId: undefined, id: "legacy-id" })],
    ["blank title", courseSnapshot({ title: " " })],
    ["missing title", courseSnapshot({ title: undefined })],
    ["nonstring level", courseSnapshot({ level: 1 })],
    ["missing level", courseSnapshot({ level: undefined })],
    ["terminal enrollment", courseSnapshot({ enrollmentStatus: "COMPLETED" })],
    ["missing enrollment", courseSnapshot({ enrollmentStatus: undefined })],
    ["unknown enrollment", courseSnapshot({ enrollmentStatus: "ACTIVE" })],
    ["missing progress", courseSnapshot({ progress: undefined })],
    ["null progress", courseSnapshot({ progress: null })],
    ["array progress", courseSnapshot({ progress: [] })],
  ])("rejects %s instead of returning a partial Course/Attempt snapshot", (_, course) => {
    expect(() => parseLearningJourney(snapshot({ courses: [course] }))).toThrow(ApiError);
  });

  it.each([
    ["completedLessons", -1], ["completedLessons", 0.5], ["completedLessons", "1"], ["completedLessons", undefined],
    ["totalLessons", -1], ["totalLessons", 1.5], ["totalLessons", undefined],
    ["completionPercentage", -0.1], ["completionPercentage", 100.1],
    ["completionPercentage", NaN], ["completionPercentage", Infinity], ["completionPercentage", -Infinity],
    ["completionPercentage", "50"], ["completionPercentage", undefined],
    ["totalStudyMinutes", -1], ["totalStudyMinutes", 1.5], ["totalStudyMinutes", undefined],
  ])("rejects invalid nested %s = %s", (field, value) => {
    const course = courseSnapshot();
    course.progress[field] = value;
    expect(() => parseLearningJourney(snapshot({ courses: [course] }))).toThrow(ApiError);
  });
});
