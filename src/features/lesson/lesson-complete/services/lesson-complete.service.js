import apiClient from "@/shared/api/api-client";

export function completeLesson(courseId, lessonId, studyMinutes, config = {}) {
  return apiClient.post(
    `/me/courses/${courseId}/lessons/${lessonId}/complete`,
    { studyMinutes },
    { ...config, validateStatus: (status) => status === 200 },
  );
}
