import apiClient from "@/shared/api/api-client";

export async function getMyCourse() {
  return apiClient.get(`/me/courses`);
}
