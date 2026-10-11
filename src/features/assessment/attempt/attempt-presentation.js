export const attemptStatusLabels = {
  CREATED: "Đã tạo",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Đã hoàn thành",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

export function formatAttemptTimestamp(value) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}
