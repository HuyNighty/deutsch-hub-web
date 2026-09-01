import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "@/shared/auth/token";

import { updateAuthSession } from "@/shared/auth/auth-session";

const API_BASE_URL = "http://localhost:8080/deutsch-hub";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

export const apiV2 = axios.create({
  baseURL: `${API_BASE_URL}/api/v2`,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
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

function attachAuthInterceptor(client) {
  client.interceptors.request.use((config) => {
    if (config.requiresAuth === false) {
      return config;
    }

    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,

    async (error) => {
      const originalRequest = error.config;

      const shouldRefresh =
        error.response?.status === 401 &&
        originalRequest?.requiresAuth !== false &&
        !originalRequest?._retry &&
        !isAuthEndpoint(originalRequest?.url);

      if (!shouldRefresh) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return client(originalRequest);
      } catch (refreshError) {
        clearTokens();

        return Promise.reject(refreshError);
      }
    },
  );
}

attachAuthInterceptor(api);
attachAuthInterceptor(apiV2);
