export function finalSubmitKey(assessmentAttemptId) {
  return ["learner-assessment-final-submit", assessmentAttemptId];
}

export function childMutationFilter(assessmentAttemptId) {
  return {
    predicate: (mutation) => {
      const key = mutation.options.mutationKey;
      return key?.[1] === assessmentAttemptId && [
        "learner-assessment-task-start", "learner-assessment-task-answer", "learner-assessment-task-submit",
      ].includes(key[0]);
    },
  };
}
