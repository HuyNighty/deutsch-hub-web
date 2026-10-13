import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import InteractionHarness from "./InteractionHarness";
import { returningFixtures } from "./interaction-fixtures";

describe("Independent interactive research modes", () => {
  it.each(["A", "B"])("%s preserves canonical evidence through local editing and scripted confirmation", (model) => {
    render(<InteractionHarness />);
    fireEvent.click(screen.getByRole("radio", { name: `Mẫu ${model}` }));
    const [a, b] = screen.getAllByRole("checkbox");
    expect(a).toBeChecked();
    expect(b).not.toBeChecked();
    fireEvent.click(b);
    expect(b).toBeChecked();
    expect(screen.getByTestId("saved-selection")).toHaveTextContent(/^A$/);
    expect(screen.getByTestId("draft-selection")).toHaveTextContent("A, B");
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu mô phỏng lưu" }));
    expect(screen.getByTestId("operation-status")).toHaveTextContent("Đang chờ");
    expect(screen.getByTestId("saved-selection")).toHaveTextContent(/^A$/);
    expect(screen.getByRole("button", { name: "Bắt đầu mô phỏng lưu" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận kịch bản" }));
    expect(screen.getByTestId("saved-selection")).toHaveTextContent("A, B");
    expect(screen.getByTestId("official-result")).toHaveTextContent("Chưa có kết quả chính thức");
    const specimen = screen.getByTestId("interaction-specimen");
    expect(within(specimen).queryByRole("button", { name: "Xác nhận kịch bản" })).not.toBeInTheDocument();
    expect(specimen.textContent).not.toMatch(/correct|incorrect|passed|đáp án đúng|đáp án sai/i);
  });
  it("reset restores canonical A and rejects a stale confirmation", () => {
    render(<InteractionHarness />);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu mô phỏng lưu" }));
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại nghiên cứu" }));
    fireEvent.click(screen.getByRole("button", { name: "Gửi lại xác nhận cũ" }));
    expect(screen.getByTestId("saved-selection")).toHaveTextContent(/^A$/);
    expect(screen.getByTestId("operation-count")).toHaveTextContent(/^0$/);
    expect(screen.getAllByRole("checkbox")[1]).not.toBeChecked();
    expect(screen.getByText(/Đã bỏ qua xác nhận ngoài khối/)).toBeInTheDocument();
  });
  it("model switching resets confirmed selections and destinations", () => {
    render(<InteractionHarness />);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu mô phỏng lưu" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận kịch bản" }));
    fireEvent.click(screen.getByRole("radio", { name: "Mẫu B" }));
    expect(screen.getByTestId("saved-selection")).toHaveTextContent(/^A$/);
    expect(screen.getByTestId("operation-count")).toHaveTextContent(/^0$/);
    fireEvent.change(screen.getByLabelText("Chế độ"), { target: { value: "returning" } });
    fireEvent.click(screen.getByRole("button", { name: "Mở bài học tiếp theo" }));
    fireEvent.click(screen.getByRole("radio", { name: "Mẫu A" }));
    expect(screen.queryByTestId("research-destination")).not.toBeInTheDocument();
  });
  it.each(["R1", "R2", "R3"])("%s uses only its canonical in-memory destination", (scenario) => {
    render(<InteractionHarness />);
    fireEvent.change(screen.getByLabelText("Chế độ"), { target: { value: "returning" } });
    fireEvent.change(screen.getByLabelText("Tình huống quay lại"), { target: { value: scenario } });
    const fixture = returningFixtures[scenario];
    const action = { R1: "Mở bài học tiếp theo", R2: "Tiếp tục bài tập", R3: "Khám phá khóa học" }[scenario];
    fireEvent.click(screen.getByRole("button", { name: action }));
    const destination = screen.getByTestId("research-destination");
    expect(destination).toHaveAttribute("data-kind", { R1: "lesson", R2: "task", R3: "catalog" }[scenario]);
    for (const [field, attribute] of [["courseId", "data-course-id"], ["lessonId", "data-lesson-id"], ["assessmentAttemptId", "data-assessment-attempt-id"], ["taskId", "data-task-id"], ["quizAttemptId", "data-quiz-attempt-id"]]) {
      if (fixture.nextActivity.target?.[field]) expect(destination).toHaveAttribute(attribute, fixture.nextActivity.target[field]);
      else expect(destination).not.toHaveAttribute(attribute);
    }
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
