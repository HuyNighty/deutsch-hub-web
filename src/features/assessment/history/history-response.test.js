import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { historyItem, historyPage } from "../test/history-fixtures";
import { parseAssessmentHistoryPage } from "./history-response";

describe("Assessment History contract", () => {
  it.each(["COMPLETED", "EXPIRED", "CANCELLED"])("preserves %s and official outcomes without deriving pass from status", (status) => {
    for (const passed of [true, false]) {
      const value = historyPage({ items: [historyItem({ status, passed })] });
      expect(parseAssessmentHistoryPage(value)).toBe(value);
      expect(value.items[0].passed).toBe(passed);
    }
    const value = historyPage({ items: [historyItem({ status, resultAvailable: false, passed: null })] });
    expect(parseAssessmentHistoryPage(value).items[0].passed).toBeNull();
  });

  it.each(["A0", "A1", "A2", "B1", "B2", "C1", "C2"])("accepts Assessment target %s", (targetLevel) => {
    const value = historyPage({ items: [historyItem({ targetLevel })] });
    expect(parseAssessmentHistoryPage(value)).toBe(value);
  });

  it("preserves nullable legacy fields and server order without fabricating values", () => {
    const value = historyPage({ items: [
      historyItem({ assessmentTitle: null, startedAt: null, expiresAt: null, resultAvailable: false, passed: null }),
      historyItem({ assessmentAttemptId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", startedAt: "2026-10-08T12:00:00.123456789Z" }),
    ], totalElements: 2 });
    expect(parseAssessmentHistoryPage(value)).toBe(value);
    expect(value.items[0]).toMatchObject({ assessmentTitle: null, startedAt: null, expiresAt: null, passed: null });
  });

  it.each([
    { items: [], totalElements: 0, totalPages: 0 },
    { items: [], page: 4, totalElements: 0, totalPages: 0 },
    { items: [], page: 3, size: 2, totalElements: 5, totalPages: 3 },
  ])("accepts legitimate empty pages %j, including out-of-range pages", (overrides) => {
    const value = historyPage(overrides);
    expect(parseAssessmentHistoryPage(value)).toBe(value);
  });

  it.each(Object.keys(historyItem()))("requires explicit %s, including nullable fields", (field) => {
    const item = historyItem();
    delete item[field];
    expect(() => parseAssessmentHistoryPage(historyPage({ items: [item] }))).toThrow(ApiError);
  });

  it.each([
    ["assessmentAttemptId", "attempt-id"], ["assessmentAttemptId", " "], ["assessmentAttemptId", null],
    ["assessmentId", "not-a-uuid"], ["assessmentId", 123],
    ["assessmentTitle", ""], ["assessmentTitle", "  "], ["assessmentTitle", 42],
    ["targetLevel", "UNKNOWN"], ["targetLevel", "A3"], ["targetLevel", null],
    ["status", "IN_PROGRESS"], ["status", "CREATED"], ["status", "FAILED"], ["status", null],
    ["startedAt", "2026-10-09"], ["startedAt", "2026-02-30T12:00:00Z"],
    ["startedAt", "2026-10-09T12:00:00"], ["startedAt", "not-a-date"],
    ["expiresAt", "2026-13-01T12:00:00Z"], ["expiresAt", "2026-10-09T25:00:00Z"],
    ["expiresAt", 123], ["resultAvailable", "true"], ["resultAvailable", null],
    ["passed", "false"], ["passed", 0],
  ])("rejects invalid %s = %j with a focused error and no partial page", (field, value) => {
    const page = historyPage({ items: [historyItem(), historyItem({ [field]: value })], totalElements: 2 });
    expect(() => parseAssessmentHistoryPage(page)).toThrow(ApiError);
    expect(() => parseAssessmentHistoryPage(page)).toThrow("The server returned an invalid assessment history response.");
  });

  it.each([true, false])("rejects an outcome %s when no official Result exists", (passed) => {
    expect(() => parseAssessmentHistoryPage(historyPage({ items: [historyItem({ resultAvailable: false, passed })] })))
      .toThrow(ApiError);
  });

  it.each(["COMPLETED", "EXPIRED", "CANCELLED"])("rejects %s with an available Result and null outcome", (status) => {
    const page = historyPage({ items: [historyItem({ status, resultAvailable: true, passed: null })] });
    expect(() => parseAssessmentHistoryPage(page)).toThrow(ApiError);
    expect(() => parseAssessmentHistoryPage(page)).toThrow("The server returned an invalid assessment history response.");
  });

  it.each([
    null, [], "history", {},
    historyPage({ items: null }), historyPage({ items: [null] }), historyPage({ items: [[]] }),
    ...["items", "page", "size", "totalElements", "totalPages"].map((field) => historyPage({ [field]: undefined })),
    historyPage({ page: -1 }), historyPage({ page: 0.5 }), historyPage({ page: "0" }),
    historyPage({ size: 0 }), historyPage({ size: -1 }), historyPage({ size: 1.5 }), historyPage({ size: "20" }),
    historyPage({ totalElements: -1 }), historyPage({ totalElements: 1.5 }), historyPage({ totalElements: "1" }),
    historyPage({ totalElements: Number.MAX_SAFE_INTEGER + 1 }),
    historyPage({ totalPages: -1 }), historyPage({ totalPages: 1.5 }), historyPage({ totalPages: "1" }),
    historyPage({ totalPages: 0 }), historyPage({ totalPages: 2 }),
    historyPage({ totalElements: 0, totalPages: 0 }),
    historyPage({ page: 1 }), historyPage({ size: 1, items: [historyItem(), historyItem()], totalElements: 2, totalPages: 2 }),
  ])("rejects malformed pagination or page shape %j", (value) => {
    expect(() => parseAssessmentHistoryPage(value)).toThrow(ApiError);
  });

  it("rejects response pagination belonging to another requested cache entry", () => {
    expect(() => parseAssessmentHistoryPage(historyPage(), { page: 1, size: 20 })).toThrow(ApiError);
    expect(() => parseAssessmentHistoryPage(historyPage(), { page: 0, size: 10 })).toThrow(ApiError);
  });
});
