import { useQuery } from "@tanstack/react-query";
import { getMyCourseDetail } from "../services/my-course-detail.service";

function useMyCourseDetail(courseId) {
  const {
    data: course,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["my-courses", courseId],
    queryFn: () => getMyCourseDetail(courseId),
    enabled: !!courseId,
  });

  return {
    course,
    loading,
    error,
  };
}

export default useMyCourseDetail;
