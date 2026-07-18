import { api } from "@/shared/api/axios";

export async function getMyCourse() {
  const response = await api.get(`/me/courses`);

  return response.data.result;
}
