import { afterEach, expect, vi } from "vitest";
import { router } from "@/app/router/routes";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { setHttpHandler } from "@/test/http";

let requests = [];

export function assessmentHttp(handler) {
  requests = [];
  const http = vi.fn((config) => {
    requests.push(config);
    return handler(config);
  });
  setHttpHandler(http);
  return http;
}

export function mountAssessmentApp(path, { anonymous = false, ...options } = {}) {
  if (!anonymous) seedSession();
  // Reuse the complete production route tree, including AppShell and guards.
  return mountSession(router.routes, { path, ...options });
}

afterEach(() => {
  const assessmentRequests = requests.filter((config) => config.url.includes("/assessments"));
  for (const config of assessmentRequests) {
    expect(config.method).toBe("get");
    expect(config.baseURL).toBe("http://localhost:8080/deutsch-hub/api/v1");
    expect(config.headers.Authorization).toMatch(/^Bearer /);
    expect(config.url).toMatch(/^\/me\/assessments(?:\/[^/]+)?$/);
  }
  requests = [];
});
