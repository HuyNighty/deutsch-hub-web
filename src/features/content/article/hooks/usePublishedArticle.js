import { useQuery } from "@tanstack/react-query";

import { getPublishedArticleBySlug } from "../services/article.service";

export function usePublishedArticle(slug) {
  const {
    data: article = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["published-article", slug],
    queryFn: () => getPublishedArticleBySlug(slug),
    enabled: !!slug,
  });

  return {
    article,
    loading,
    error,
    refetch,
  };
}
