import axios from "axios";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import {
  getSessionGeneration,
  isCurrentSession,
  rotateAuthSession,
  terminateAuthSession,
} from "@/shared/auth/auth-session";
import { unwrapApiResponse } from "./api-response";

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

let inFlightRefresh = null;

function isAuthEndpoint(url = "") {
  return ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"]
    .some((path) => url.includes(path));
}

export function refreshAccessToken(generation = getSessionGeneration()) {
  if (!isCurrentSession(generation)) return Promise.reject(new Error("Session changed"));
  if (inFlightRefresh?.generation === generation) return inFlightRefresh.promise;

  const flight = { generation, promise: null };
  flight.promise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const response = await refreshClient.post("/auth/refresh", { refreshToken });
      return rotateAuthSession(unwrapApiResponse(response.data), generation);
    } catch (error) {
      terminateAuthSession(generation);
      throw error;
    }
  })().finally(() => {
    // An older refresh must not remove a newer generation's flight.
    if (inFlightRefresh === flight) inFlightRefresh = null;
  });
  inFlightRefresh = flight;
  return flight.promise;
}

function attachAuthInterceptor(client) {
  client.interceptors.request.use(
    (config) => {
      if (config.requiresAuth === false || isAuthEndpoint(config.url)) return config;

      if (config._sessionGeneration === undefined) {
        config._sessionGeneration = getSessionGeneration();
      }
      if (!isCurrentSession(config._sessionGeneration)) {
        throw new axios.CanceledError("Session changed", config);
      }

      const accessToken = getAccessToken();
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      config._sessionAccessToken = accessToken;
      return config;
    },
    (error) => { throw error; },
    { synchronous: true },
  );

  client.interceptors.response.use(
    (response) => {
      if (response.config._sessionGeneration !== undefined &&
          !isCurrentSession(response.config._sessionGeneration)) {
        throw new axios.CanceledError("Session changed", response.config);
      }
      return response;
    },
    async (error) => {
      const request = error.config;
      if (error.response?.status !== 401 || !request ||
          request.refreshOnUnauthorized === false ||
          request.requiresAuth === false || isAuthEndpoint(request.url) ||
          !isCurrentSession(request._sessionGeneration)) throw error;

      if (request._retry) {
        terminateAuthSession(request._sessionGeneration);
        throw error;
      }
      request._retry = true;

      // A delayed 401 may arrive after this generation already rotated its token.
      // Retry with that token instead of issuing another refresh.
      if (!getAccessToken() || getAccessToken() === request._sessionAccessToken) {
        await refreshAccessToken(request._sessionGeneration);
      }
      if (!isCurrentSession(request._sessionGeneration)) throw error;
      return client(request);
    },
  );
}

attachAuthInterceptor(api);
attachAuthInterceptor(apiV2);
