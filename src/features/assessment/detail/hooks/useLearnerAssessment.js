import { useQuery } from "@tanstack/react-query";
import { getLearnerAssessment } from "../../shared/assessment.service";

export function useLearnerAssessment(assessmentId) {
  return useQuery({
    queryKey: ["learner-assessment", assessmentId],
    queryFn: ({ queryKey: [, id] }) => getLearnerAssessment(id),
    enabled: Boolean(assessmentId),
  });
}
