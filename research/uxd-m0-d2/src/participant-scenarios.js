import { assessmentFixture } from "./interaction-fixtures";
import { assessmentTransition, initialAssessmentState } from "./interaction-state";

export const assessmentCases = Object.freeze({
  draft: Object.freeze({ label: "Tương tác bản nháp", kind: null }),
  liveConfirmed: Object.freeze({ label: "Chuyển tiếp trực tiếp — xác nhận lựa chọn", kind: "save", outcome: "confirmed", live: true }),
  liveError: Object.freeze({ label: "Chuyển tiếp trực tiếp — lỗi xác định", kind: "save", outcome: "error", live: true }),
  liveUncertain: Object.freeze({ label: "Chuyển tiếp trực tiếp — chưa xác định", kind: "save", outcome: "uncertain", live: true }),
  liveSubmit: Object.freeze({ label: "Chuyển tiếp trực tiếp — nộp bài tập", kind: "submit", outcome: "confirmed", live: true }),
  pending: Object.freeze({ label: "Đọc trạng thái — đang chờ", kind: "save", snapshot: true }),
  confirmed: Object.freeze({ label: "Đọc trạng thái — đã xác nhận", kind: "save", outcome: "confirmed", snapshot: true }),
  error: Object.freeze({ label: "Đọc trạng thái — lỗi xác định", kind: "save", outcome: "error", snapshot: true }),
  uncertain: Object.freeze({ label: "Đọc trạng thái — chưa xác định", kind: "save", outcome: "uncertain", snapshot: true }),
  submitted: Object.freeze({ label: "Đọc trạng thái — bài tập đã nộp", kind: "submit", outcome: "confirmed", snapshot: true }),
});

export function assessmentCaseState(caseId) {
  const scenario = assessmentCases[caseId];
  let state = initialAssessmentState();
  if (!scenario?.snapshot) return state;
  if (scenario.kind === "save") {
    state = assessmentTransition(state, { type: "edit", answerId: assessmentFixture.runtime.questions[0].options[1].answerId });
  }
  state = assessmentTransition(state, { type: "start", kind: scenario.kind });
  return scenario.outcome
    ? assessmentTransition(state, { type: "settle", ticket: state.operation, outcome: scenario.outcome })
    : state;
}

export function validPendingInterval(value) {
  return String(value).trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= 100 && Number(value) <= 60000;
}
