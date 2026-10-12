import { isApiError } from "@/shared/api/api-error";
import { TaskSubmitResponseError } from "../task/task-response";
import { FinalSubmitResponseError } from "../attempt/final-submit-response";

const operations = {
  start: "bắt đầu bài tập",
  answer: "cập nhật câu trả lời",
  taskSubmit: "nộp bài tập",
  finalSubmit: "hoàn tất bài đánh giá",
};

export function assessmentExecutionError(error, operation) {
  const action = operations[operation];
  // Untyped parser diagnostics are recognized only at their original local boundary.
  const localResponseError = isApiError(error) && error.status === null && error.code === null && (
    error.message === "The server returned an unexpected response." ||
    (operation === "start" && error.message === "The server returned an invalid assessment task start response.") ||
    (operation === "answer" && [
      "The server returned an invalid assessment task answer response.",
      "The server returned an invalid assessment task clear response.",
    ].includes(error.message))
  );
  if (localResponseError || (operation === "taskSubmit" && error instanceof TaskSubmitResponseError) ||
      (operation === "finalSubmit" && error instanceof FinalSubmitResponseError)) {
    return `Máy chủ trả về phản hồi ${action} không hợp lệ. Chưa thể xác nhận kết quả thao tác.`;
  }
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    return `Máy chủ từ chối yêu cầu ${action}. Vui lòng kiểm tra lại trạng thái trước khi thử lại.`;
  }
  return `Chưa thể xác nhận yêu cầu ${action}. Yêu cầu có thể đã được ghi nhận. Vui lòng kiểm tra lại trạng thái trước khi thử lại.`;
}
