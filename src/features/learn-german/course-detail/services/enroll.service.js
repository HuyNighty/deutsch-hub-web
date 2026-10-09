import apiClient from "@/shared/api/api-client";

export function enrollCourse(courseId, config = {}) {
  return apiClient.post(`/courses/${courseId}/enroll`, undefined, {
    ...config,
    validateStatus: (status) => status === 200,
  });
}
