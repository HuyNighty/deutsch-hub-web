import { api } from "@/shared/api/axios";

export async function getCourses() {
  const response = await api.get("/courses");

  return response.data.result.items;
}
