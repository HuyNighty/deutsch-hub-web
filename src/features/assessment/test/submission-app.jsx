import { ok } from "@/test/http";
import { assessmentHttp } from "./assessment-app";
import { assessmentDetail } from "./fixtures";
import { attemptUrl } from "./attempt-fixtures";
import { TASK_URL, TASK_SUBMIT_URL, taskRuntime } from "./task-fixtures";

export function submissionHttp(handler, { runtime = taskRuntime(), definition = assessmentDetail(), runtimeRead } = {}) {
  return assessmentHttp((config) => {
    if (config.method === "get" && config.url === TASK_URL) {
      return runtimeRead ? runtimeRead(config) : ok(config, runtime);
    }
    if (config.url === `${attemptUrl}/assessment`) return ok(config, definition);
    return handler(config);
  }, { allowTaskExecution: true, allowTaskSubmit: true });
}

export function submitRequests(http) {
  return http.mock.calls.filter(([config]) => config.url === TASK_SUBMIT_URL);
}

export function runtimeReads(http) {
  return http.mock.calls.filter(([config]) => config.method === "get" && config.url === TASK_URL);
}

export function answerRequests(http) {
  return http.mock.calls.filter(([config]) => config.url.includes("/answers/"));
}
