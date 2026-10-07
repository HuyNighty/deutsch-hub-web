export function resultKey(assessmentAttemptId) {
  return ["learner-assessment-result", assessmentAttemptId];
}

export function competencyKey() {
  return ["learner-competency"];
}

export function resultRoute(assessmentAttemptId) {
  return `/my-learning/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}/result`;
}
