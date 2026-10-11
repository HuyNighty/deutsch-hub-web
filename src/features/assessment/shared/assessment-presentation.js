export function assessmentTitle(title) {
  return title === null ? "Bài đánh giá chưa có tên" : title;
}

export function assessmentTimeLimit(timeLimitMinutes) {
  return timeLimitMinutes === null ? "Không giới hạn thời gian" : `${timeLimitMinutes} phút`;
}

export const skillLabels = {
  LISTENING: "Nghe",
  READING: "Đọc",
  WRITING: "Viết",
  SPEAKING: "Nói",
};

export const executionModeLabels = {
  SEQUENTIAL: "Tuần tự",
  INDEPENDENT: "Độc lập",
};
