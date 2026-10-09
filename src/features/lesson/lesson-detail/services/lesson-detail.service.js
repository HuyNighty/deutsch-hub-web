import apiClient from "@/shared/api/api-client";

export function getLessonDetail(courseId, lessonId, config = {}) {
  return apiClient.get(`/me/courses/${courseId}/lessons/${lessonId}`, config);
}
