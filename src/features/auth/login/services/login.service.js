import { api } from "@/shared/api/axios";

export async function login(request) {
  const response = await api.post("/auth/login", request);

  return response.data.result;
}
