import { useQuery } from "@tanstack/react-query";
import { getNextActivity } from "../next-activity.service";

export const nextActivityKey = ["learner-next-activity"];
export const nextActivityOptions = {
  queryKey: nextActivityKey, queryFn: getNextActivity, retry: false,
};

export function useNextActivity() {
  return useQuery(nextActivityOptions);
}
