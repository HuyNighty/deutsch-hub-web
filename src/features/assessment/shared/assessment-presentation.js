export function assessmentTitle(title) {
  return title === null ? "Untitled assessment" : title;
}

export function assessmentTimeLimit(timeLimitMinutes) {
  return timeLimitMinutes === null ? "No time limit" : `${timeLimitMinutes} minutes`;
}

export const skillLabels = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

export const executionModeLabels = {
  SEQUENTIAL: "Sequential",
  INDEPENDENT: "Independent",
};
