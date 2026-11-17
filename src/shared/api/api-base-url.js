// A public, build-time Vite setting. Never place credentials or secrets in VITE_*.
export const LOCAL_API_BASE_URL = "http://localhost:8080/deutsch-hub";

/**
 * Return the backend origin + context path, WITHOUT /api/v1 or /api/v2.
 * Development keeps the historical local default. Production must be explicit.
 * Supports HTTPS absolute URLs or same-origin root-relative reverse-proxy paths.
 */
export function resolveApiBaseUrl(configuredUrl, { development = false } = {}) {
  if (configuredUrl != null && typeof configuredUrl !== "string") {
    throw new Error("VITE_API_BASE_URL must be a string.");
  }

  const value = configuredUrl?.trim() ?? "";
  if (!value) {
    if (development) return LOCAL_API_BASE_URL;
    throw new Error("VITE_API_BASE_URL is required for a production build.");
  }

  if (/\/api\/v[12]\/?$/i.test(value)) {
    throw new Error("VITE_API_BASE_URL must omit the /api/v1 and /api/v2 suffixes.");
  }

  // Absolute-path proxy routes are valid for same-origin deployments.
  if (value.startsWith("/") && !value.startsWith("//")) {
    if (/[?#\\\s]/.test(value)) {
      throw new Error("VITE_API_BASE_URL must be a path without query or fragment.");
    }
    return value.replace(/\/+$/, "");
  }

  if (value.includes("\\")) {
    throw new Error("VITE_API_BASE_URL must not contain backslashes.");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_API_BASE_URL must be an HTTPS URL or a root-relative path.");
  }

  if (!["https:", "http:"].includes(url.protocol) ||
      (!development && url.protocol !== "https:")) {
    throw new Error("VITE_API_BASE_URL requires HTTPS for production.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("VITE_API_BASE_URL must not contain credentials, query or fragment.");
  }

  const host = url.hostname.toLowerCase();
  if (!development &&
      (host === "localhost" || host.endsWith(".localhost") ||
       host === "0.0.0.0" || host.startsWith("127.") ||
       host === "[::1]" || host === "::1")) {
    throw new Error("VITE_API_BASE_URL must not reference a loopback host in production.");
  }

  return url.origin + url.pathname.replace(/\/+$/, "");
}
