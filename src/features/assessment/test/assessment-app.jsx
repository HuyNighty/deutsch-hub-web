import { afterEach, expect, vi } from "vitest";
import { router } from "@/app/router/routes";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { journey } from "./attempt-fixtures";

let requests = [];
let startAllowed = false;
let taskExecutionAllowed = false;
let taskSubmitAllowed = false;
let finalSubmitAllowed = false;
let resultReadsAllowed = false;
let courseDetailReadsAllowed = false;
let lessonReadsAllowed = false;
let lessonCompleteAllowed = false;

export function assessmentHttp(handler, {
  allowStart = false, allowTaskExecution = false, allowTaskSubmit = false, allowFinalSubmit = false, allowResultReads = false,
  allowCourseDetailReads = false,
  allowLessonReads = false, allowLessonComplete = false,
} = {}) {
  requests = [];
  startAllowed = allowStart;
  taskExecutionAllowed = allowTaskExecution;
  taskSubmitAllowed = allowTaskSubmit;
  finalSubmitAllowed = allowFinalSubmit;
  resultReadsAllowed = allowResultReads;
  courseDetailReadsAllowed = allowCourseDetailReads;
  lessonReadsAllowed = allowLessonReads;
  lessonCompleteAllowed = allowLessonComplete;
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
    const isSubmit = /^\/me\/assessment-attempts\/[^/]+\/tasks\/[^/]+\/quiz-attempt\/submit$/.test(config.url);
    const isFinalSubmit = /^\/me\/assessment-attempts\/[^/]+\/submit$/.test(config.url);
    const isResultRead = /^\/me\/assessment-attempts\/[^/]+\/result$/.test(config.url) || config.url === "/me/competency";
    const isLesson = /^\/me\/courses\/[^/]+\/lessons\/[^/]+$/.test(config.url);
    const isLessonComplete = /^\/me\/courses\/[^/]+\/lessons\/[^/]+\/complete$/.test(config.url);
    const isHistory = config.url === "/me/assessment-attempts/history";
    if (isHistory) {
      expect(config.method).toBe("get");
      expect(config.data).toBeUndefined();
      expect(Object.keys(config.params).sort()).toEqual(["page", "size"]);
      expect(Number.isInteger(config.params.page) && config.params.page >= 0).toBe(true);
      expect(Number.isInteger(config.params.size) && config.params.size > 0).toBe(true);
    } else if (isLessonComplete) {
      expect(lessonCompleteAllowed).toBe(true);
      expect(config.method).toBe("post");
      expect(Object.keys(JSON.parse(config.data))).toEqual(["studyMinutes"]);
    } else if (isLesson) {
      expect(lessonReadsAllowed).toBe(true);
      expect(config.method).toBe("get");
      expect(config.data).toBeUndefined();
    } else if (/^\/me\/courses\/[^/]+$/.test(config.url)) {
      expect(courseDetailReadsAllowed).toBe(true);
      expect(config.method).toBe("get");
      expect(config.data).toBeUndefined();
    } else if (isResultRead) {
      expect(resultReadsAllowed).toBe(true);
      expect(config.method).toBe("get");
      expect(config.data).toBeUndefined();
    } else if (isFinalSubmit) {
      expect(finalSubmitAllowed).toBe(true);
      expect(config.method).toBe("post");
      expect(config.data).toBeUndefined();
    } else if (isSubmit) {
      expect(taskSubmitAllowed).toBe(true);
      expect(config.method).toBe("post");
      expect(config.data).toBeUndefined();
    } else if (isTask) {
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
    expect(config.url).toMatch(/^\/me\/(?:courses(?:\/[^/]+(?:\/lessons\/[^/]+(?:\/complete)?)?)?|competency|assessments(?:\/[^/]+(?:\/attempts)?)?|assessment-attempts\/[^/]+(?:\/assessment|\/submit|\/result|\/tasks\/[^/]+\/quiz-attempt(?:\/answers\/[^/]+|\/submit)?)?|learning-journey|learning-direction|next-activity)$/);
  }
  requests = [];
  startAllowed = false;
  taskExecutionAllowed = false;
  taskSubmitAllowed = false;
  finalSubmitAllowed = false;
  resultReadsAllowed = false;
  courseDetailReadsAllowed = false;
  lessonReadsAllowed = false;
  lessonCompleteAllowed = false;
});
