export const resultSkillLabels = {
  LISTENING: "Nghe",
  READING: "Đọc",
  WRITING: "Viết",
  SPEAKING: "Nói",
};

export const resultOutcome = (passed) => passed ? "Đạt" : "Chưa đạt";

export function resultErrorMessage(error) {
  if (error.status === 404) return "Kết quả đánh giá chưa có.";
  if (error.status === 403) return "Bạn không có quyền xem kết quả đánh giá này.";
  if (["ERR_NETWORK", "NETWORK_ERROR", "ECONNABORTED"].includes(error.code)) {
    return "Không thể kết nối để tải kết quả đánh giá. Vui lòng thử lại.";
  }
  return "Không thể tải kết quả đánh giá. Vui lòng thử lại.";
}
