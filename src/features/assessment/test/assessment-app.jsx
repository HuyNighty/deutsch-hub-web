import { afterEach, expect, vi } from "vitest";
import { router } from "@/app/router/routes";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { journey } from "./attempt-fixtures";

let requests = [];
let startAllowed = false;
let taskExecutionAllowed = false;

export function assessmentHttp(handler, { allowStart = false, allowTaskExecution = false } = {}) {
  requests = [];
  startAllowed = allowStart;
  taskExecutionAllowed = allowTaskExecution;
  const http = vi.fn((config) => {
    requests.push(config);
    return handler(config);
  });
  setHttpHandler(http);
  return http;
}

// M1.1 scenarios now resolve the new action boundary with an explicitly empty index.
export function emptyJourneyHttp(handler) {
  return assessmentHttp((config) => config.url === "/me/learning-journey"
    ? ok(config, journey()) : handler(config));
}

export function mountAssessmentApp(path, { anonymous = false, ...options } = {}) {
  if (!anonymous) seedSession();
  // Reuse the complete production route tree, including AppShell and guards.
  return mountSession(router.routes, { path, ...options });
}

afterEach(() => {
  const assessmentRequests = requests.filter((config) => config.url.startsWith("/me/"));
  for (const config of assessmentRequests) {
    const isStart = /^\/me\/assessments\/[^/]+\/attempts$/.test(config.url);
    const isTask = /^\/me\/assessment-attempts\/[^/]+\/tasks\/[^/]+\/quiz-attempt(?:\/answers\/[^/]+)?$/.test(config.url);
    if (isTask) {
      expect(taskExecutionAllowed).toBe(true);
      const isAnswer = config.url.includes("/answers/");
      expect(isAnswer ? ["put", "delete"] : ["get", "post"]).toContain(config.method);
      if (config.method === "put") {
        const body = JSON.parse(config.data);
        expect(Object.keys(body)).toEqual(["selectedAnswerIds"]);
        expect(body.selectedAnswerIds.length).toBeGreaterThan(0);
      } else {
        expect(config.data).toBeUndefined();
      }
    } else if (isStart) {
      expect(startAllowed).toBe(true);
      expect(config.method).toBe("post");
      expect(config.data).toBeUndefined();
    } else {
      expect(config.method).toBe("get");
    }
    expect(config.baseURL).toBe("http://localhost:8080/deutsch-hub/api/v1");
    expect(config.headers.Authorization).toMatch(/^Bearer /);
    expect(config.url).toMatch(/^\/me\/(?:courses|assessments(?:\/[^/]+(?:\/attempts)?)?|assessment-attempts\/[^/]+(?:\/assessment|\/tasks\/[^/]+\/quiz-attempt(?:\/answers\/[^/]+)?)?|learning-journey)$/);
  }
  requests = [];
  startAllowed = false;
  taskExecutionAllowed = false;
});
