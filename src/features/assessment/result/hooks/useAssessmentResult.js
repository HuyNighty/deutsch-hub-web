import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { getAssessmentResult } from "../result.service";
import { resultKey } from "../result-query";

export function useAssessmentResult(assessmentAttemptId, definition) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: resultKey(assessmentAttemptId),
    queryFn: () => getAssessmentResult(assessmentAttemptId, definition),
    enabled: Boolean(isAuthenticated && assessmentAttemptId && definition), retry: false,
  });
}
