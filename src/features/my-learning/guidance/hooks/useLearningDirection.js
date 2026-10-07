import { useQuery } from "@tanstack/react-query";
import { getLearningDirection } from "../direction.service";

export const learningDirectionKey = ["learner-learning-direction"];
export const learningDirectionOptions = {
  queryKey: learningDirectionKey, queryFn: getLearningDirection, retry: false,
};

export function useLearningDirection() {
  return useQuery(learningDirectionOptions);
}
