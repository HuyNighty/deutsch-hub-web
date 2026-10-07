import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { getAssessmentAttempt } from "../attempt.service";
import { useAttemptDefinition } from "./useAttemptDefinition";

export function useAssessmentAttempt(assessmentAttemptId) {
  const attempt = useQuery({
    queryKey: ["learner-assessment-attempt", assessmentAttemptId],
    queryFn: () => getAssessmentAttempt(assessmentAttemptId),
    enabled: Boolean(assessmentAttemptId),
  });
  const definition = useAttemptDefinition(assessmentAttemptId);
  const mismatch = attempt.data && definition.data &&
    attempt.data.assessmentId !== definition.data.assessmentId;
  const error = attempt.error || definition.error || (mismatch
    ? new ApiError({ message: "The attempt and assessment definition do not match." }) : null);

  return {
    attempt: attempt.data,
    definition: definition.data,
    error,
    isLoading: !error && (attempt.isLoading || definition.isLoading),
    refetch: () => Promise.all([attempt.refetch(), definition.refetch()]),
  };
}
