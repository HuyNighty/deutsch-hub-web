import { useQuery } from "@tanstack/react-query";
import { getCompetency } from "../result.service";
import { competencyKey } from "../result-query";

export function useCompetency() {
  return useQuery({ queryKey: competencyKey(), queryFn: getCompetency, retry: false });
}
