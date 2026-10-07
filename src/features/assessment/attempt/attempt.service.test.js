import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { ok } from "@/test/http";
import { seedSession } from "@/test/session-fixtures";
import { assessmentHttp } from "../test/assessment-app";
import { assessmentDetail, ASSESSMENT_ID } from "../test/fixtures";
import { ATTEMPT_ID, journey, liveAttempt, startedAttempt, resumedAttempt } from "../test/attempt-fixtures";
import { getLearningJourney, startAssessment, getAssessmentAttempt, getAttemptDefinition } from "./attempt.service";

function response(result) {
  seedSession();
  return assessmentHttp((config) => ok(config, result), { allowStart: true });
}

describe("narrow Journey response boundary", () => {
  it.each([
    ["null", null],
    ["array", []],
    ["missing attempts", {}],
    ["nonarray attempts", { assessmentAttempts: {} }],
    ["null snapshot", journey([null])],
    ["blank attempt ID", journey([liveAttempt({ assessmentAttemptId: "" })])],
    ["blank assessment ID", journey([liveAttempt({ assessmentId: " " })])],
    ["UNKNOWN level", journey([liveAttempt({ targetLevel: "UNKNOWN" })])],
    ["missing level", journey([liveAttempt({ targetLevel: undefined })])],
    ["terminal status", journey([liveAttempt({ status: "COMPLETED" })])],
    ["missing status", journey([liveAttempt({ status: undefined })])],
    ["null start", journey([liveAttempt({ startedAt: null })])],
    ["date-only start", journey([liveAttempt({ startedAt: "2025-06-01" })])],
    ["invalid start", journey([liveAttempt({ startedAt: "2025-99-99T08:00:00Z" })])],
    ["impossible calendar day", journey([liveAttempt({ startedAt: "2025-02-30T08:00:00Z" })])],
    ["nonleap February", journey([liveAttempt({ startedAt: "2025-02-29T08:00:00Z" })])],
    ["rolled midnight", journey([liveAttempt({ startedAt: "2025-06-01T24:00:00Z" })])],
    ["blank deadline", journey([liveAttempt({ expiresAt: " " })])],
    ["missing deadline", journey([liveAttempt({ expiresAt: undefined })])],
  ])("rejects %s rather than returning a partial active index", async (_, result) => {
    response(result);
    await expect(getLearningJourney()).rejects.toBeInstanceOf(ApiError);
  });

  it.each(["A0", "A1", "A2", "B1", "B2", "C1", "C2"])(
    "accepts %s and validates only consumed snapshots, without deadline derivation or Course validation", async (targetLevel) => {
      const snapshot = journey([liveAttempt({ targetLevel, expiresAt: null })], { courses: "unconsumed", currentLevel: "UNKNOWN" });
      const http = response(snapshot);
      await expect(getLearningJourney()).resolves.toEqual(snapshot);
      expect(http.mock.calls[0][0].url).toBe("/me/learning-journey");
    },
  );
});

describe("separate Start and resume DTO boundaries", () => {
  it("accepts Backend timestamp precision and a valid leap date", async () => {
    const result = resumedAttempt({ startedAt: "2024-02-29T08:00:00.123456789Z", expiresAt: "2024-03-01T08:00:00+00:00" });
    response(result);
    await expect(getAssessmentAttempt(ATTEMPT_ID)).resolves.toEqual(result);
  });
  it.each([
    ["null", null],
    ["array", []],
    ["missing id", startedAttempt({ id: undefined })],
    ["GET identity field only", { ...startedAttempt({ id: undefined }), assessmentAttemptId: ATTEMPT_ID }],
    ["blank assessment", startedAttempt({ assessmentId: "" })],
    ["different assessment", startedAttempt({ assessmentId: "another-assessment" })],
    ["blank user", startedAttempt({ userId: " " })],
    ["terminal status", startedAttempt({ status: "COMPLETED" })],
    ["null start", startedAttempt({ startedAt: null })],
    ["zone-less start", startedAttempt({ startedAt: "2025-06-01T08:00:00" })],
    ["invalid deadline", startedAttempt({ expiresAt: "invalid" })],
    ["missing deadline", startedAttempt({ expiresAt: undefined })],
    ["nonarray tasks", startedAttempt({ taskAttempts: null })],
    ["null task", startedAttempt({ taskAttempts: [null] })],
    ["missing task attempt id", startedAttempt({ taskAttempts: [{ taskId: "task", quizAttemptId: null }] })],
    ["blank task", startedAttempt({ taskAttempts: [{ id: "task-attempt", taskId: " ", quizAttemptId: null }] })],
    ["missing quiz id", startedAttempt({ taskAttempts: [{ id: "task-attempt", taskId: "task" }] })],
    ["blank quiz id", startedAttempt({ taskAttempts: [{ id: "task-attempt", taskId: "task", quizAttemptId: "" }] })],
  ])("rejects Start %s", async (_, result) => {
    response(result);
    await expect(startAssessment(ASSESSMENT_ID)).rejects.toBeInstanceOf(ApiError);
  });

  it.each([null, "quiz-attempt"])("accepts Start quiz identity %s without sending a body", async (quizAttemptId) => {
    const result = startedAttempt({ taskAttempts: [{ id: "task-attempt", taskId: "task", quizAttemptId }] });
    const http = response(result);
    await expect(startAssessment(ASSESSMENT_ID)).resolves.toEqual(result);
    expect(http.mock.calls[0][0]).toMatchObject({
      method: "post", url: `/me/assessments/${ASSESSMENT_ID}/attempts`, data: undefined,
    });
  });

  it.each([
    ["null", null],
    ["array", []],
    ["blank attempt", resumedAttempt({ assessmentAttemptId: " " })],
    ["route mismatch", resumedAttempt({ assessmentAttemptId: "other-attempt" })],
    ["POST identity only", { ...resumedAttempt({ assessmentAttemptId: undefined }), id: ATTEMPT_ID }],
    ["blank assessment", resumedAttempt({ assessmentId: "" })],
    ["unknown status", resumedAttempt({ status: "UNKNOWN" })],
    ["missing start", resumedAttempt({ startedAt: undefined })],
    ["numeric start", resumedAttempt({ startedAt: 1234 })],
    ["invalid start", resumedAttempt({ startedAt: "today" })],
    ["missing deadline", resumedAttempt({ expiresAt: undefined })],
    ["date-only deadline", resumedAttempt({ expiresAt: "2025-06-01" })],
    ["missing tasks", resumedAttempt({ taskAttempts: undefined })],
    ["null task", resumedAttempt({ taskAttempts: [null] })],
    ["blank task", resumedAttempt({ taskAttempts: [{ taskId: " ", quizAttemptId: "quiz" }] })],
    ["null quiz", resumedAttempt({ taskAttempts: [{ taskId: "task", quizAttemptId: null }] })],
  ])("rejects resume %s", async (_, result) => {
    response(result);
    await expect(getAssessmentAttempt(ATTEMPT_ID)).rejects.toBeInstanceOf(ApiError);
  });

  it.each(["CREATED", "IN_PROGRESS", "COMPLETED", "EXPIRED", "CANCELLED"])(
    "accepts returned %s and nullable times without changing effective status", async (status) => {
      const result = resumedAttempt({ status, startedAt: null, expiresAt: null });
      response(result);
      await expect(getAssessmentAttempt(ATTEMPT_ID)).resolves.toEqual(result);
    },
  );

  it("accepts empty task lists for both contracts without inventing cardinality rules", async () => {
    response(startedAttempt({ taskAttempts: [] }));
    await expect(startAssessment(ASSESSMENT_ID)).resolves.toHaveProperty("taskAttempts", []);
    response(resumedAttempt({ taskAttempts: [] }));
    await expect(getAssessmentAttempt(ATTEMPT_ID)).resolves.toHaveProperty("taskAttempts", []);
  });
});

describe("stable Attempt definition service", () => {
  it("uses the Attempt endpoint and existing learner definition parser with historical nulls", async () => {
    const definition = assessmentDetail({ title: null, timeLimitMinutes: null });
    const http = response(definition);
    await expect(getAttemptDefinition(ATTEMPT_ID)).resolves.toEqual(definition);
    expect(http.mock.calls[0][0].url).toBe(`/me/assessment-attempts/${ATTEMPT_ID}/assessment`);
  });

  it("rejects malformed stable definition structure", async () => {
    const definition = assessmentDetail();
    definition.components[0].tasks[0].quizRevisionId = " ";
    response(definition);
    await expect(getAttemptDefinition(ATTEMPT_ID)).rejects.toBeInstanceOf(ApiError);
  });
});
