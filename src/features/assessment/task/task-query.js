export function taskQuizKey(assessmentAttemptId, taskId) {
  return ["learner-assessment-task-quiz", assessmentAttemptId, taskId];
}

export function taskRoute(assessmentAttemptId, taskId) {
  return `/my-learning/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}/tasks/${encodeURIComponent(taskId)}`;
}
