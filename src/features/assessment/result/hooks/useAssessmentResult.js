import { useQuery } from "@tanstack/react-query";
import { getAssessmentResult } from "../result.service";
import { resultKey } from "../result-query";

export function useAssessmentResult(assessmentAttemptId, definition) {
  return useQuery({
    queryKey: resultKey(assessmentAttemptId),
    queryFn: () => getAssessmentResult(assessmentAttemptId, definition),
    enabled: Boolean(assessmentAttemptId && definition), retry: false,
  });
}
