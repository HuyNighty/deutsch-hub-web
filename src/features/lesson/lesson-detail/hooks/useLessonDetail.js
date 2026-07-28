import { useQuery } from "@tanstack/react-query";
import { getLessonDetail } from "../services/lesson-detail.service";

export default function useLessonDetail(courseId, lessonId) {
  const {
    data: lesson,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["courses", courseId, "lessons", lessonId],
    queryFn: () => getLessonDetail(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });

  return {
    lesson,
    loading,
    error,
    refetch,
  };
}
