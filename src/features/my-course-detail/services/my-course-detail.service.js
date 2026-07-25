import apiClient from "@/shared/api/api-client";

export function getMyCourseDetail(courseId) {
  return apiClient.get(`/me/courses/${courseId}`);
}
