import { api } from "@/shared/api/axios";

export async function getCourseDetail(courseId) {
  const response = await api.get(`/courses/${courseId}`);

  return response.data.result;
}
