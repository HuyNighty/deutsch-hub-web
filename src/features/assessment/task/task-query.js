export function taskQuizKey(assessmentAttemptId, taskId) {
  return ["learner-assessment-task-quiz", assessmentAttemptId, taskId];
}

export function taskAnswerKey(assessmentAttemptId, taskId) {
  return ["learner-assessment-task-answer", assessmentAttemptId, taskId];
}

export function taskStartKey(assessmentAttemptId, taskId) {
  return ["learner-assessment-task-start", assessmentAttemptId, taskId];
}

export function taskSubmitKey(assessmentAttemptId, taskId) {
  return ["learner-assessment-task-submit", assessmentAttemptId, taskId];
}

export function taskRoute(assessmentAttemptId, taskId) {
  return `/my-learning/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}/tasks/${encodeURIComponent(taskId)}`;
}
