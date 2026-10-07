import { useQuery } from "@tanstack/react-query";
import { listLearnerAssessments } from "../../shared/assessment.service";

export function useLearnerAssessments({ page, size }) {
  return useQuery({
    queryKey: ["learner-assessments", { page, size }],
    queryFn: ({ queryKey: [, pagination] }) => listLearnerAssessments(pagination),
  });
}
