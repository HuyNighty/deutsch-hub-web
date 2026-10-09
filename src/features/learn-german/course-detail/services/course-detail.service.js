import apiClient from "@/shared/api/api-client";

export function getViewerCourseDetail(courseId, config = {}) {
  return apiClient.get(`/courses/${courseId}/viewer`, config);
}
