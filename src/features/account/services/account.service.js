import apiClient from "@/shared/api/api-client";

export function getAccount() {
  return apiClient.get("/auth/me");
}
