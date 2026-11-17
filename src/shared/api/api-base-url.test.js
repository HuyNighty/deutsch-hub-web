import { describe, expect, it } from "vitest";
import { LOCAL_API_BASE_URL, resolveApiBaseUrl } from "./api-base-url";

describe("DeutschHub API origin configuration", () => {
  it("preserves the historical local backend only for development with no override", () => {
    expect(resolveApiBaseUrl(undefined, { development: true })).toBe(LOCAL_API_BASE_URL);
    expect(resolveApiBaseUrl("  ", { development: true })).toBe(LOCAL_API_BASE_URL);
  });

  it("supports a development override without changing the API context path contract", () => {
    expect(resolveApiBaseUrl("http://127.0.0.1:9000/deutsch-hub/", { development: true }))
      .toBe("http://127.0.0.1:9000/deutsch-hub");
  });

  it("accepts a production HTTPS origin with its Spring context path", () => {
    expect(resolveApiBaseUrl("https://api.deutschhub.example/deutsch-hub///"))
      .toBe("https://api.deutschhub.example/deutsch-hub");
  });

  it("accepts a same-origin reverse-proxy path for production", () => {
    expect(resolveApiBaseUrl("/deutsch-hub/")).toBe("/deutsch-hub");
    expect(resolveApiBaseUrl("/")).toBe("");
  });

  it.each([undefined, null, "", " \t "])(
    "fails production configuration when API root is absent (%s)",
    (value) => {
      expect(() => resolveApiBaseUrl(value)).toThrow(/VITE_API_BASE_URL is required/);
    },
  );

  it.each([
    "http://localhost:8080/deutsch-hub",
    "http://api.deutschhub.example/deutsch-hub",
    "https://127.0.0.1:8443/deutsch-hub",
    "https://localhost/deutsch-hub",
    "https://dev.localhost/deutsch-hub",
  ])("rejects an insecure/loopback production origin (%s)", (url) => {
    expect(() => resolveApiBaseUrl(url)).toThrow();
  });

  it.each([
    "//api.deutschhub.example/deutsch-hub",
    "ftp://api.deutschhub.example/deutsch-hub",
    "api.deutschhub.example/deutsch-hub",
    "https://user:password@api.deutschhub.example/deutsch-hub",
    "https://api.deutschhub.example/deutsch-hub?token=sensitive",
    "https://api.deutschhub.example/deutsch-hub#fragment",
    "/deutsch-hub?secret=1",
    "/deutsch-hub#fragment",
    "/deutsch-hub\\broken",
  ])("rejects ambiguous or sensitive public API settings (%s)", (url) => {
    expect(() => resolveApiBaseUrl(url)).toThrow();
  });

  it.each(["/deutsch-hub/api/v1", "https://api.deutschhub.example/deutsch-hub/api/v2"])(
    "avoids a duplicated API namespace suffix (%s)",
    (url) => {
      expect(() => resolveApiBaseUrl(url)).toThrow(/omit the \/api\/v1/);
    },
  );

  it("rejects invalid configuration value types", () => {
    expect(() => resolveApiBaseUrl(123)).toThrow(/must be a string/);
  });
});
