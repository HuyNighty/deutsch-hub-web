import { api } from "@/shared/api/axios";

export async function register(request) {
  const response = await api.post("/auth/register", request);

  return response.data.result;
}
