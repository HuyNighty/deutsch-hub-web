import { describe, it, expect } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { TaskSubmitResponseError } from "../task/task-response";
import { FinalSubmitResponseError } from "../attempt/final-submit-response";
import { assessmentExecutionError } from "./assessment-execution-error";

const privateMessage = "PRIVATE_BACKEND_MESSAGE <script>secret</script>";
const operations = [
  ["start", "bắt đầu bài tập"], ["answer", "cập nhật câu trả lời"],
  ["taskSubmit", "nộp bài tập"], ["finalSubmit", "hoàn tất bài đánh giá"],
];

function presentUnchanged(error, operation) {
  const before = { message: error.message, status: error.status, code: error.code, errors: error.errors, name: error.name };
  Object.freeze(error.errors);
  Object.freeze(error);
  const label = assessmentExecutionError(error, operation);
  expect({ message: error.message, status: error.status, code: error.code, errors: error.errors, name: error.name }).toEqual(before);
  expect(error).toBeInstanceOf(ApiError);
  expect(label).not.toContain(privateMessage);
  return label;
}

describe.each(operations)("Assessment execution error presentation: %s", (operation, action) => {
  it.each([400, 403, 404, 409])("presents explicit %s refusal without inventing a business cause or exposing server content", (status) => {
    const error = new ApiError({ status, code: 9999, message: privateMessage });
    expect(presentUnchanged(error, operation)).toBe(`Máy chủ từ chối yêu cầu ${action}. Vui lòng kiểm tra lại trạng thái trước khi thử lại.`);
  });

  it.each([{ status: 500 }, { code: "ERR_NETWORK" }, { code: "ECONNABORTED" }, {}])(
    "keeps an unconfirmed outcome uncertain for %j", (evidence) => {
      const error = new ApiError({ ...evidence, message: privateMessage });
      expect(presentUnchanged(error, operation)).toBe(`Chưa thể xác nhận yêu cầu ${action}. Yêu cầu có thể đã được ghi nhận. Vui lòng kiểm tra lại trạng thái trước khi thử lại.`);
    },
  );
});

it.each([
  ["finalSubmit", "hoàn tất bài đánh giá", () => new ApiError({ message: "The server returned an unexpected response." })],
  ["start", "bắt đầu bài tập", () => new ApiError({ message: "The server returned an invalid assessment task start response." })],
  ["answer", "cập nhật câu trả lời", () => new ApiError({ message: "The server returned an invalid assessment task answer response." })],
  ["answer", "cập nhật câu trả lời", () => new ApiError({ message: "The server returned an invalid assessment task clear response." })],
  ["taskSubmit", "nộp bài tập", () => new TaskSubmitResponseError()],
  ["finalSubmit", "hoàn tất bài đánh giá", () => new FinalSubmitResponseError()],
])("recognizes the original local malformed-response boundary for %s", (operation, action, createError) => {
  const error = createError();
  const originalType = error.constructor;
  expect(presentUnchanged(error, operation)).toBe(`Máy chủ trả về phản hồi ${action} không hợp lệ. Chưa thể xác nhận kết quả thao tác.`);
  expect(error).toBeInstanceOf(originalType);
});

it("does not treat a server-supplied parser-like message as a local parser error", () => {
  const error = new ApiError({ status: 400, code: 9999, message: "The server returned an invalid assessment task start response." });
  expect(presentUnchanged(error, "start")).toContain("Máy chủ từ chối");
});
