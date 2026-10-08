import apiClient from "@/shared/api/api-client";
import { parseAccount } from "../account-response";

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
