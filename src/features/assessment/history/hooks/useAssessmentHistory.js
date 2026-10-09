import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { listAssessmentHistory } from "../history.service";

export function useAssessmentHistory({ page, size }) {
  const { isAuthenticated } = useAuth();
  const generation = getSessionGeneration();

  return useQuery({
    queryKey: ["learner-assessment-history", { page, size }],
    queryFn: ({ queryKey: [, pagination] }) =>
      listAssessmentHistory(pagination, { _sessionGeneration: generation }),
    enabled: isAuthenticated,
  });
}
