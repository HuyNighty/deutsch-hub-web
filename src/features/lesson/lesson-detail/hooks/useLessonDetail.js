import { useQuery } from "@tanstack/react-query";
import { getLessonDetail } from "../services/lesson-detail.service";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { getSessionGeneration } from "@/shared/auth/auth-session";

export default function useLessonDetail(courseId, lessonId) {
  const { isAuthenticated } = useAuth();
  const generation = getSessionGeneration();
  const {
    data: lesson,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["courses", courseId, "lessons", lessonId],
    queryFn: () => getLessonDetail(courseId, lessonId, { _sessionGeneration: generation }),
    enabled: !!courseId && !!lessonId && isAuthenticated,
  });

  return {
    lesson,
    loading,
    error,
    refetch,
  };
}
