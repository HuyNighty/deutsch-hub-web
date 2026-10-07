import { useQuery } from "@tanstack/react-query";
import { getLearningJourney } from "../attempt.service";

export const learningJourneyKey = ["learner-learning-journey"];
export const learningJourneyOptions = {
  queryKey: learningJourneyKey,
  queryFn: getLearningJourney,
  retry: false,
};

export function useLearningJourney() {
  return useQuery(learningJourneyOptions);
}
