import { useQuery } from "@tanstack/react-query";

import { getActiveCategories } from "../services/category.service";

export function useActiveCategories() {
  const {
    data: categories = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["active-categories"],
    queryFn: getActiveCategories,
  });

  return {
    categories,
    loading,
    error,
    refetch,
  };
}
