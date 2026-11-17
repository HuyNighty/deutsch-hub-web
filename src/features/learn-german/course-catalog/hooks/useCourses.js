import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getCoursePage } from "../services/course.service";

export function useCourses(keyword = "") {
  const query = useInfiniteQuery({
    queryKey: ["published-course-pages", keyword],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => getCoursePage({ page: pageParam, keyword, signal }),
    getNextPageParam: (lastPage, allPages) => {
      const page = Number.isInteger(lastPage?.page) ? lastPage.page : allPages.length - 1;
      const totalPages = lastPage?.totalPages;
      return Number.isInteger(totalPages) && page + 1 < totalPages ? page + 1 : undefined;
    },
    retry: false,
  });

  const pages = query.data?.pages ?? [];
  const courses = useMemo(() => {
    const seen = new Set();
    return (query.data?.pages ?? [])
      .flatMap((page) => Array.isArray(page?.items) ? page.items : [])
      .filter((course) => {
        if (!course?.id || seen.has(course.id)) return false;
        seen.add(course.id);
        return true;
      });
  }, [query.data]);

  const totalElements = pages[0]?.totalElements ?? courses.length;

  return {
    courses,
    totalElements,
    loading: query.isPending,
    error: pages.length === 0 ? query.error : null,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    fetchingNextPage: query.isFetchingNextPage,
    nextPageError: pages.length > 0 && query.isFetchNextPageError ? query.error : null,
  };
}
