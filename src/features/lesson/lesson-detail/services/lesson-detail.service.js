import { api } from "@/shared/api/axios";

export async function getLessonDetail(courseId, lessonId) {
  const response = await api.get(`/me/courses/${courseId}/lessons/${lessonId}`);

  return response.data.result;
}
