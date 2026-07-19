import { api } from "@/shared/api/axios";

export async function refresh(refreshToken) {
  const response = await api.post("/auth/refresh", {
    refreshToken,
  });

  return response.data.result;
}

export async function logout(refreshToken) {
  const response = await api.post("/auth/logout", {
    refreshToken,
  });

  return response.data;
}
