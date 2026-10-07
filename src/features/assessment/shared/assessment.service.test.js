import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { ok, setHttpHandler } from "@/test/http";
import { seedSession } from "@/test/session-fixtures";
import { listLearnerAssessments, getLearnerAssessment } from "./assessment.service";
import { assessmentPage, assessmentDetail, summary, ASSESSMENT_ID } from "../test/fixtures";

describe("learner Assessment response boundary", () => {
  const invalidPages = [
    ["non-object", () => null],
    ["array page", () => []],
    ["missing items", () => ({ ...assessmentPage(), items: undefined })],
    ["fractional page", () => assessmentPage({ page: 0.5 })],
    ["nonfinite page", () => assessmentPage({ page: Infinity })],
    ["zero size", () => assessmentPage({ size: 0 })],
    ["string size", () => assessmentPage({ size: "20" })],
    ["negative total", () => assessmentPage({ totalElements: -1 })],
    ["nonfinite pages", () => assessmentPage({ totalPages: Infinity })],
    ["missing metadata", () => ({ items: [] })],
  ];
  it.each(invalidPages)("rejects catalog 200 with %s as ApiError", async (_, invalid) => {
    seedSession();
    setHttpHandler((config) => ok(config, invalid()));
    await expect(listLearnerAssessments({ page: 0, size: 20 })).rejects.toBeInstanceOf(ApiError);
  });

  const invalidSummaries = [
    ["non-object item", () => null],
    ["blank ID", () => summary({ assessmentId: " " })],
    ["ARCHIVED status", () => summary({ status: "ARCHIVED" })],
    ["UNKNOWN level", () => summary({ targetLevel: "UNKNOWN" })],
    ["invalid level", () => summary({ targetLevel: "D1" })],
    ["missing title", () => { const item = summary(); delete item.title; return item; }],
    ["blank title", () => summary({ title: "  " })],
    ["numeric title", () => summary({ title: 42 })],
    ["zero time", () => summary({ timeLimitMinutes: 0 })],
    ["fractional time", () => summary({ timeLimitMinutes: 1.5 })],
    ["missing time", () => { const item = summary(); delete item.timeLimitMinutes; return item; }],
  ];
  it.each(invalidSummaries)("rejects the whole catalog for %s", async (_, invalid) => {
    seedSession();
    setHttpHandler((config) => ok(config, assessmentPage({ items: [summary(), invalid()] })));
    await expect(listLearnerAssessments()).rejects.toBeInstanceOf(ApiError);
  });

  const invalidDetails = [
    ["null", () => null],
    ["blank assessment ID", () => assessmentDetail({ assessmentId: "" })],
    ["UNKNOWN level", () => assessmentDetail({ targetLevel: "UNKNOWN" })],
    ["blank title", () => assessmentDetail({ title: "" })],
    ["negative time", () => assessmentDetail({ timeLimitMinutes: -1 })],
    ["non-array components", () => assessmentDetail({ components: {} })],
    ["null component", () => assessmentDetail({ components: [null] })],
    ["blank component ID", () => {
      const detail = assessmentDetail(); detail.components[0].componentId = " "; return detail;
    }],
    ["non-array tasks", () => {
      const detail = assessmentDetail(); detail.components[0].tasks = null; return detail;
    }],
    ["null task", () => {
      const detail = assessmentDetail(); detail.components[0].tasks = [null]; return detail;
    }],
    ["blank task ID", () => {
      const detail = assessmentDetail(); detail.components[0].tasks[0].taskId = ""; return detail;
    }],
    ["fractional task order", () => {
      const detail = assessmentDetail(); detail.components[0].tasks[0].order = 1.5; return detail;
    }],
    ["blank quiz revision ID", () => {
      const detail = assessmentDetail(); detail.components[0].tasks[0].quizRevisionId = " "; return detail;
    }],
  ];
  it.each(invalidDetails)("rejects Detail 200 with %s", async (_, invalid) => {
    seedSession();
    setHttpHandler((config) => ok(config, invalid()));
    await expect(getLearnerAssessment(ASSESSMENT_ID)).rejects.toBeInstanceOf(ApiError);
  });

  it.each(["A0", "A1", "A2", "B1", "B2", "C1", "C2"])("accepts supported target level %s without deriving eligibility", async (targetLevel) => {
    seedSession();
    const page = assessmentPage({ items: [summary({ targetLevel, title: null, timeLimitMinutes: null })] });
    const detail = assessmentDetail({ targetLevel, title: null, timeLimitMinutes: null });
    setHttpHandler((config) => ok(config, config.url === "/me/assessments" ? page : detail));
    await expect(listLearnerAssessments()).resolves.toEqual(page);
    await expect(getLearnerAssessment(ASSESSMENT_ID)).resolves.toEqual(detail);
  });

  it("accepts exposed empty component/task arrays without inventing additional constraints or thresholds", async () => {
    seedSession();
    const emptyDetail = assessmentDetail({ components: [] });
    const noTasks = assessmentDetail({ components: [{
      componentId: "empty-component", skillDimension: "READING", executionMode: "INDEPENDENT", tasks: [],
    }] });
    setHttpHandler((config) => ok(config, emptyDetail));
    await expect(getLearnerAssessment(ASSESSMENT_ID)).resolves.toEqual(emptyDetail);
    setHttpHandler((config) => ok(config, noTasks));
    await expect(getLearnerAssessment(ASSESSMENT_ID)).resolves.toEqual(noTasks);
  });

  it("rejects a malformed ApiResponse envelope through the existing shared boundary", async () => {
    seedSession();
    setHttpHandler((config) => ({ ...ok(config, assessmentPage()), data: { result: assessmentPage() } }));
    await expect(listLearnerAssessments()).rejects.toBeInstanceOf(ApiError);
  });
});
