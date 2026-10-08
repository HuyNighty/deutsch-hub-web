import apiClient from "@/shared/api/api-client";
import { parseAccount } from "../account-response";
import { parseSessions } from "../session-response";

export async function getAccount() {
  return parseAccount(await apiClient.get("/auth/me"));
}

export async function updateProfile({ firstName, lastName, phoneNumber }) {
  return parseAccount(await apiClient.patch("/users/me/profile", { firstName, lastName, phoneNumber }));
}

export function changePassword({ currentPassword, newPassword, verifyNewPassword }) {
  return apiClient.put("/users/me/password", { currentPassword, newPassword, verifyNewPassword }, {
    refreshOnUnauthorized: false,
    validateStatus: (status) => status === 200,
  });
}

export async function getSessions({ signal } = {}) {
  return parseSessions(await apiClient.get("/users/me/sessions", { signal }));
}

export function revokeSession(sessionId) {
  return apiClient.delete(`/users/me/sessions/${sessionId}`, { validateStatus: (status) => status === 200 });
}

export function logoutAllSessions() {
  return apiClient.post("/users/me/logout-all", undefined, {
    refreshOnUnauthorized: false,
    validateStatus: (status) => status === 200,
  });
}

export function deactivateAccount({ password }) {
  return apiClient.patch("/users/me/deactivate", { password }, {
    refreshOnUnauthorized: false,
    validateStatus: (status) => status === 200,
  });
}
