import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "@/shared/auth/token";

import { updateAuthSession } from "@/shared/auth/auth-session";

const baseURL = "http://localhost:8080/deutsch-hub/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

function isAuthEndpoint(url = "") {
  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
  ].some((path) => url.includes(path));
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    refreshPromise = refreshClient
      .post("/auth/refresh", { refreshToken })
      .then((response) => {
        const session = response.data.result;

        updateAuthSession(session);

        return session.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const shouldRefresh =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint(originalRequest?.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();

      return Promise.reject(refreshError);
    }
  },
);
