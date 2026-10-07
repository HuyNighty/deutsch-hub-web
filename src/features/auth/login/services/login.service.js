import apiClient from "@/shared/api/api-client";
import { validateLoginResult } from "@/shared/auth/auth-result";

export async function login(request) {
  const session = await apiClient.post("/auth/login", request, { requiresAuth: false });
  validateLoginResult(session);
  return session;
}
