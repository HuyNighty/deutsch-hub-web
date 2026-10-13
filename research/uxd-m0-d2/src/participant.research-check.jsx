import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ParticipantHarness from "./ParticipantHarness";
import ParticipantAssessment from "./ParticipantAssessment";
import { assessmentCases, assessmentCaseState, validPendingInterval } from "./participant-scenarios";
import { assessmentFixture, returningFixtures } from "./interaction-fixtures";
import { surfaces } from "./surfaces";

const options = assessmentFixture.runtime.questions[0].options;
function open({ study = "assessment", model = "A", caseId = "draft", context = "publicHome", returning = "R1", interval = "1000" } = {}) {
  render(<ParticipantHarness />);
  fireEvent.change(screen.getByLabelText("Nghiên cứu"), { target: { value: study } });
  fireEvent.change(screen.getByLabelText("Mẫu"), { target: { value: model } });
  if (study === "surface") fireEvent.change(screen.getByLabelText("Bối cảnh"), { target: { value: context } });
  if (study === "returning") fireEvent.change(screen.getByLabelText("Tình huống quay lại"), { target: { value: returning } });
  if (study === "assessment") {
    fireEvent.change(screen.getByLabelText("Tình huống đánh giá"), { target: { value: caseId } });
    if (assessmentCases[caseId].live) fireEvent.change(screen.getByLabelText("Khoảng chờ hiệu chỉnh (ms)"), { target: { value: interval } });
  }
  fireEvent.click(screen.getByRole("button", { name: "Chuẩn bị bàn giao" }));
  fireEvent.click(screen.getByRole("button", { name: "Bắt đầu tình huống" }));
}
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Participant isolation and parity", () => {
  it.each(["surface", "assessment", "returning"])("%s removes private setup and restores it only after explicit handoff", (study) => {
    open({ study });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/Mẫu A|Mẫu B|S1 —|S2 —|S3 —|R1 —/)).not.toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveFocus();
    expect(screen.getByRole("note")).toHaveTextContent("không lưu dữ liệu");
    fireEvent.click(screen.getByRole("button", { name: "Tạm dừng và bàn giao" }));
    expect(screen.getByRole("heading", { name: "Tạm dừng nghiên cứu" })).toHaveFocus();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bàn giao cho người điều phối" }));
    expect(screen.getByRole("heading", { name: /Thiết lập riêng/ })).toHaveFocus();
    expect(screen.getByLabelText("Nghiên cứu")).toHaveValue(study);
  });
  const combinations = [
    ...Object.keys(surfaces).map((context) => ({ study: "surface", context })),
    { study: "assessment" },
    ...["R1", "R2", "R3"].map((returning) => ({ study: "returning", returning })),
  ];
  it.each(combinations)("only the reading fill differs for $study/$context/$returning", (configuration) => {
    function specimen(model) {
      open({ ...configuration, model });
      const main = document.querySelector("main").cloneNode(true);
      const fill = main.style.getPropertyValue("--research-reading-fill");
      main.style.removeProperty("--research-reading-fill");
      const result = { markup: main.outerHTML, fill };
      cleanup();
      return result;
    }
    const a = specimen("A");
    const b = specimen("B");
    expect(a.markup).toBe(b.markup);
    const context = configuration.study === "surface" ? configuration.context : configuration.study === "assessment" ? "assessment" : "myLearning";
    expect(a.fill).toBe(surfaces[context].A);
    expect(b.fill).toBe(surfaces[context].B);
  });
});

describe("Predetermined operations and comprehensible state", () => {
  it("requires explicit interval calibration and has no default duration", () => {
    render(<ParticipantHarness />);
    fireEvent.change(screen.getByLabelText("Nghiên cứu"), { target: { value: "assessment" } });
    fireEvent.change(screen.getByLabelText("Tình huống đánh giá"), { target: { value: "liveConfirmed" } });
    expect(screen.getByLabelText("Khoảng chờ hiệu chỉnh (ms)")).toHaveValue(null);
    fireEvent.submit(screen.getByRole("button", { name: "Chuẩn bị bàn giao" }).closest("form"));
    expect(screen.queryByRole("button", { name: "Bắt đầu tình huống" })).not.toBeInTheDocument();
  });
  it.each(["", "0", "-1", "99", "60001", "100.5", "NaN"])("rejects invalid calibration %s", (value) => {
    expect(validPendingInterval(value)).toBe(false);
  });
  it.each(["100", "1500", "60000"])("accepts calibration %s without declaring acceptance", (value) => {
    expect(validPendingInterval(value)).toBe(true);
  });
  it("associates the authored question and distinguishes focus, draft and confirmed options", () => {
    open();
    const group = screen.getByRole("group", { name: /Câu hỏi/ });
    expect(group).toHaveAccessibleDescription(assessmentFixture.runtime.questions[0].content);
    const b = screen.getByRole("checkbox", { name: options[1].content });
    b.focus();
    expect(b).not.toBeChecked();
    fireEvent.click(b);
    expect(b).toBeChecked();
    expect(screen.getByTestId("saved-selection")).toHaveTextContent(options[0].content);
    expect(screen.getByTestId("saved-selection")).not.toHaveTextContent(options[1].content);
    expect(screen.getByTestId("draft-selection")).toHaveTextContent(options[1].content);
    expect(screen.getByTestId("operation-status")).toHaveTextContent("Chưa bắt đầu");
  });
  it.each(["liveConfirmed", "liveError", "liveUncertain", "liveSubmit"])("%s runs once, preserves stable regions and keeps parent/Result separate", (caseId) => {
    vi.useFakeTimers();
    open({ caseId });
    const spec = assessmentCases[caseId];
    const status = screen.getByRole("status");
    const alert = screen.getByRole("alert");
    const scheduled = vi.spyOn(globalThis, "setTimeout");
    if (spec.kind === "save") fireEvent.click(screen.getAllByRole("checkbox")[1]);
    const cue = screen.getByRole("button", { name: "Chạy tình huống mô phỏng" });
    cue.focus();
    fireEvent.click(cue);
    fireEvent.click(cue);
    expect(cue).toHaveAttribute("aria-disabled", "true");
    expect(cue).toHaveFocus();
    expect(status).toHaveTextContent("Đang chờ");
    expect(screen.getAllByRole("checkbox")[0]).toBeDisabled();
    expect(scheduled.mock.calls.filter((call) => call[1] === 1000)).toHaveLength(1);
    act(() => vi.advanceTimersByTime(999));
    expect(status).toHaveTextContent("Đang chờ");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toBe(status);
    expect(screen.getByRole("alert")).toBe(alert);
    if (spec.outcome === "confirmed") {
      expect(status).toHaveTextContent(spec.kind === "submit" ? "xác nhận nộp bài tập" : "xác nhận lựa chọn");
      if (spec.kind === "save") expect(screen.getByTestId("saved-selection")).toHaveTextContent(options[1].content);
    } else {
      expect(screen.getByTestId("saved-selection")).not.toHaveTextContent(options[1].content);
      expect(spec.outcome === "error" ? alert : status).toHaveTextContent(spec.outcome === "error" ? "lỗi xác định" : "Kết quả chưa xác định");
    }
    expect(screen.getByTestId("task-status")).toHaveTextContent(spec.kind === "submit" ? "Đã nộp" : "Đang thực hiện");
    expect(screen.getByTestId("assessment-status")).toHaveTextContent("Đang thực hiện");
    expect(screen.getByTestId("official-result")).toHaveTextContent("Chưa có");
    fireEvent.click(cue);
    expect(scheduled.mock.calls.filter((call) => call[1] === 1000)).toHaveLength(1);
    if (spec.outcome === "uncertain") expect(screen.getAllByRole("checkbox")[1]).toBeDisabled();
  });
  it("cancels pending work on pause, resets on the next task and cancels on unmount", () => {
    vi.useFakeTimers();
    open({ caseId: "liveConfirmed" });
    const scheduled = vi.spyOn(globalThis, "setTimeout");
    const cancelled = vi.spyOn(globalThis, "clearTimeout");
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Chạy tình huống mô phỏng" }));
    const operationIndex = scheduled.mock.calls.findIndex((call) => call[1] === 1000);
    expect(operationIndex).toBeGreaterThanOrEqual(0);
    const operationTimer = scheduled.mock.results[operationIndex].value;
    fireEvent.click(screen.getByRole("button", { name: "Tạm dừng và bàn giao" }));
    expect(cancelled).toHaveBeenCalledWith(operationTimer);
    fireEvent.click(screen.getByRole("button", { name: "Bàn giao cho người điều phối" }));
    fireEvent.click(screen.getByRole("button", { name: "Chuẩn bị bàn giao" }));
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu tình huống" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId("operation-status")).toHaveTextContent("Chưa bắt đầu");
    expect(screen.getByTestId("saved-selection")).not.toHaveTextContent(options[1].content);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Chạy tình huống mô phỏng" }));
    const nextIndex = scheduled.mock.calls.findLastIndex((call) => call[1] === 1000);
    const nextTimer = scheduled.mock.results[nextIndex].value;
    expect(nextTimer).not.toBe(operationTimer);
    cleanup();
    expect(cancelled).toHaveBeenCalledWith(nextTimer);
  });
  it.each(["pending", "confirmed", "error", "uncertain", "submitted"])("%s snapshot is deterministic comprehension, not a scheduled transition", (caseId) => {
    vi.useFakeTimers();
    const scheduled = vi.spyOn(globalThis, "setTimeout");
    render(<ParticipantAssessment caseId={caseId} pendingMs={1000} />);
    const state = assessmentCaseState(caseId);
    expect(state.phase).toBe(caseId === "submitted" ? "confirmed" : caseId);
    expect(state.saved).toEqual(caseId === "confirmed" ? options.map((option) => option.answerId) : [options[0].answerId]);
    expect(state.draft).toEqual(caseId === "submitted" ? [options[0].answerId] : options.map((option) => option.answerId));
    expect(state.taskStatus).toBe(caseId === "submitted" ? "SUBMITTED" : "IN_PROGRESS");
    expect(screen.queryByRole("button", { name: "Chạy tình huống mô phỏng" })).not.toBeInTheDocument();
    for (const checkbox of screen.getAllByRole("checkbox")) expect(checkbox).toBeDisabled();
    expect(scheduled.mock.calls.filter((call) => call[1] === 1000)).toHaveLength(0);
  });
});

describe("Returning continuity", () => {
  it.each([
    ["R1", "Tiếp tục học", "course", "direction"],
    ["R1", "Mở bài học tiếp theo", "lesson", "nextActivity"],
    ["R2", "Tiếp tục đánh giá", "assessment", "direction"],
    ["R2", "Tiếp tục bài tập", "task", "nextActivity"],
    ["R3", "Khám phá khóa học", "catalog", "nextActivity"],
  ])("%s/%s retains identity, destination focus, trigger focus and surface", (returning, name, kind, field) => {
    open({ study: "returning", returning, model: "B" });
    const trigger = screen.getByRole("button", { name });
    fireEvent.click(trigger);
    const destination = screen.getByTestId("research-destination");
    expect(destination).toHaveAttribute("data-kind", kind);
    for (const [key, attribute] of [["courseId", "data-course-id"], ["lessonId", "data-lesson-id"], ["assessmentAttemptId", "data-assessment-attempt-id"], ["taskId", "data-task-id"], ["quizAttemptId", "data-quiz-attempt-id"]]) {
      const value = returningFixtures[returning][field].target?.[key];
      if (value) expect(destination).toHaveAttribute(attribute, value);
      else expect(destination).not.toHaveAttribute(attribute);
    }
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Quay lại tình huống" }));
    expect(screen.getByRole("button", { name })).toHaveFocus();
    expect(screen.getByTestId("interaction-specimen").style.getPropertyValue("--research-reading-fill")).toBe(surfaces.myLearning.B);
  });
});
