import { useQuery } from "@tanstack/react-query";

import { getActiveTopicsByCategoryId } from "../services/topic.service";

export function useActiveTopicsByCategoryId(categoryId) {
  const {
    data: topics = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["active-topics", categoryId],
    queryFn: () => getActiveTopicsByCategoryId(categoryId),
    enabled: !!categoryId,
  });

  return {
    topics,
    loading,
    error,
    refetch,
  };
}
