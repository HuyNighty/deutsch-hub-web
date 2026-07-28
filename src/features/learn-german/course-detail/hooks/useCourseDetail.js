import { useQuery } from "@tanstack/react-query";
import { getViewerCourseDetail } from "../services/course-detail.service";

export function useCourseDetail(courseId) {
  const {
    data: course,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["courses", courseId],
    queryFn: () => getViewerCourseDetail(courseId),
    enabled: !!courseId,
  });

  return {
    course,
    loading,
    error,
    refetch,
  };
}
