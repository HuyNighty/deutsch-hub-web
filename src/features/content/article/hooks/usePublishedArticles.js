import { useQuery } from "@tanstack/react-query";

import { getPublishedArticles } from "../services/article.service";

export function usePublishedArticles(params = {}) {
  const {
    data: page,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["published-articles", params],
    queryFn: () => getPublishedArticles(params),
  });

  return {
    articles: page?.content ?? [],
    totalElements: page?.totalElements ?? 0,
    page: page?.page ?? 0,
    size: page?.size ?? 20,
    loading,
    error,
    refetch,
  };
}
