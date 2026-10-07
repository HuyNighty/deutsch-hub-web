import { useQuery } from "@tanstack/react-query";
import { getAttemptDefinition } from "../attempt.service";

export function useAttemptDefinition(assessmentAttemptId) {
  return useQuery({
    queryKey: ["learner-assessment-attempt-definition", assessmentAttemptId],
    queryFn: () => getAttemptDefinition(assessmentAttemptId),
    enabled: Boolean(assessmentAttemptId),
  });
}
