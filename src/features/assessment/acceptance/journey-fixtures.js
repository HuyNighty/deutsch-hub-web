import { nextActivityUrl, noActivity } from "@/test/next-activity-fixtures";
import { directionUrl, discoverDirection } from "@/test/direction-fixtures";
import { afterEach, expect } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import { getAccessToken } from "@/shared/auth/token";
import { loginResult } from "@/test/session-fixtures";
import { ok, fail } from "@/test/http";
import { assessmentHttp } from "../test/assessment-app";
import { ASSESSMENT_ID, assessmentDetail, assessmentPage } from "../test/fixtures";
import { ATTEMPT_ID, attemptPath, attemptUrl, journeyUrl, startUrl, journey, liveAttempt, resumedAttempt, startedAttempt } from "../test/attempt-fixtures";
import { taskRuntime, startedTask, submittedTask, savedAnswer, clearedAnswer, SUBMITTED_AT } from "../test/task-fixtures";
import { finalResult, FINAL_URL } from "../test/final-submit-fixtures";
import { RESULT_URL, RESULT_KEY, COMPETENCY_URL, COMPETENCY_KEY, competency } from "../test/result-fixtures";

export const CATALOG_PATH = "/my-learning/assessments";
export const DEFINITION_URL = `${attemptUrl}/assessment`;
export const DEFINITION_KEY = ["learner-assessment-attempt-definition", ATTEMPT_ID];
export const PARENT_KEY = ["learner-assessment-attempt", ATTEMPT_ID];
export const taskUrl = (task) => `${attemptUrl}/tasks/${task.taskId}/quiz-attempt`;
export const taskPath = (task) => `${attemptPath}/tasks/${task.taskId}`;
export const taskKey = (task) => ["learner-assessment-task-quiz", ATTEMPT_ID, task.taskId];
export const requestSequence = (http) => http.mock.calls.map(([config]) => [config.method, config.url]);
export const writes = (http) => requestSequence(http).filter(([method, url]) => method !== "get" && url.startsWith("/me/"));

const audits = [];
afterEach(() => {
  for (const audit of audits) expect(audit).toEqual([]);
  audits.length = 0;
});

// Stateful transport fixture: only explicit, armed learner clicks may mutate it.
// It represents Backend responses, not an eligibility rule added to the frontend.
export function journeyServer({
  active = false, expired = false, finalized = false, conflict = false,
  definition = assessmentDetail(), submitted = [], bound = [], denyTaskId,
  answerGate, competencyGate, malformedFinal = false,
} = {}) {
  const tasks = definition.components.flatMap((component) => component.tasks);
  const runtimes = new Map();
  const state = { active, settled: finalized, status: expired ? "EXPIRED" : finalized ? "COMPLETED" : "IN_PROGRESS" };
  const audit = [];
  audits.push(audit);
  let armed = null;
  let answerHeld = false;
  const result = finalResult({ componentResults: finalResult().componentResults.reverse() });
  const currentCompetency = () => competency({ currentLevel: state.settled ? "B2" : "A2" });
  const parent = () => resumedAttempt({ status: state.status,
    taskAttempts: [...runtimes.values()].map(({ taskId, quizAttemptId }) => ({ taskId, quizAttemptId })) });
  function runtimeFor(task) {
    return taskRuntime({ taskId: task.taskId, quizAttemptId: `quiz-attempt-${task.taskId}`,
      quizId: `quiz-${task.taskId}`, quizRevisionId: task.quizRevisionId,
      questions: [structuredClone(taskRuntime().questions[0])] });
  }
  for (const task of tasks.filter((item) => bound.includes(item.taskId) || submitted.includes(item.taskId))) {
    const runtime = runtimeFor(task);
    if (submitted.includes(task.taskId)) Object.assign(runtime, { status: "SUBMITTED", submittedAt: SUBMITTED_AT });
    runtimes.set(task.taskId, runtime);
  }
  function rejectUnexpected(config) {
    const message = `Unexpected acceptance request: ${config.method} ${config.url}`;
    audit.push(message);
    throw new Error(message);
  }
  const http = assessmentHttp(async (config) => {
    if (config.url === "/auth/login" && config.method === "post") return ok(config, loginResult("learner-a"));
    expect(config.baseURL).toBe("http://localhost:8080/deutsch-hub/api/v1");
    expect(config.headers.Authorization).toBe(`Bearer ${getAccessToken()}`);
    if (!config.url.startsWith("/me/")) return rejectUnexpected(config);
    if (config.method === "get") expect(config.data).toBeUndefined();
    else {
      const actual = { method: config.method, url: config.url,
        body: config.data === undefined ? undefined : JSON.parse(config.data) };
      if (!armed || actual.method !== armed.method || actual.url !== armed.url) return rejectUnexpected(config);
      expect(actual).toEqual(armed);
      armed = null;
    }
    const read = (value) => ok(config, structuredClone(value));
    if (config.method === "get") {
      if (config.url === nextActivityUrl) return read(noActivity);
      if (config.url === directionUrl) return read(discoverDirection);
      if (config.url === "/me/assessments") {
        expect(config.params).toEqual({ page: 0, size: 20 });
        return read(assessmentPage());
      }
      if (config.url === `/me/assessments/${ASSESSMENT_ID}` || config.url === DEFINITION_URL) return read(definition);
      if (config.url === journeyUrl) return read(journey(state.active && state.status === "IN_PROGRESS" ? [liveAttempt()] : [],
        { learningDomain: "DEUTSCH", currentLevel: "A2" }));
      if (config.url === attemptUrl) return read(parent());
      if (config.url === RESULT_URL) return state.settled ? read(result) : fail(config, 404);
      if (config.url === COMPETENCY_URL) {
        if (competencyGate) await competencyGate.promise;
        return read(currentCompetency());
      }
      const task = tasks.find((item) => config.url === taskUrl(item));
      if (task && runtimes.has(task.taskId)) return read(runtimes.get(task.taskId));
      return rejectUnexpected(config);
    }
    if (config.method === "post" && config.url === startUrl) {
      state.active = true;
      if (conflict) return fail(config, 409);
      return read(startedAttempt({ taskAttempts: [] }));
    }
    if (config.method === "post" && config.url === FINAL_URL) {
      if (malformedFinal) return read({ ...result, id: "" });
      if (state.status === "IN_PROGRESS" && tasks.some((task) => runtimes.get(task.taskId)?.status !== "SUBMITTED")) return fail(config, 400);
      state.settled = true;
      if (state.status !== "EXPIRED") state.status = "COMPLETED";
      return read(result);
    }
    const task = tasks.find((item) => config.url === taskUrl(item) || config.url.startsWith(`${taskUrl(item)}/`));
    if (!task) return rejectUnexpected(config);
    if (config.method === "post" && config.url === taskUrl(task)) {
      if (task.taskId === denyTaskId) return fail(config, 400);
      const runtime = runtimeFor(task);
      runtimes.set(task.taskId, runtime);
      return read(startedTask({ taskId: task.taskId, quizAttemptId: runtime.quizAttemptId,
        quizId: runtime.quizId, quizRevisionId: task.quizRevisionId }));
    }
    const runtime = runtimes.get(task.taskId);
    if (!runtime) return rejectUnexpected(config);
    if (config.method === "post" && config.url === `${taskUrl(task)}/submit`) {
      Object.assign(runtime, { status: "SUBMITTED", submittedAt: SUBMITTED_AT });
      return read(submittedTask({ taskId: task.taskId, quizAttemptId: runtime.quizAttemptId }));
    }
    const question = runtime.questions.find((item) => config.url === `${taskUrl(task)}/answers/${item.questionId}`);
    if (!question || !["put", "delete"].includes(config.method)) return rejectUnexpected(config);
    if (answerGate && !answerHeld) {
      answerHeld = true;
      await answerGate.promise;
    }
    question.selectedAnswerIds = config.method === "put" ? JSON.parse(config.data).selectedAnswerIds : [];
    const identity = { taskId: task.taskId, quizAttemptId: runtime.quizAttemptId };
    return read(config.method === "put" ? savedAnswer(question.questionId, question.selectedAnswerIds, identity)
      : clearedAnswer(question.questionId, identity));
  }, { allowStart: true, allowTaskExecution: true, allowTaskSubmit: true, allowFinalSubmit: true, allowResultReads: true });

  async function clickWrite(user, element, method, url, body) {
    expect(armed).toBeNull();
    armed = { method, url, body };
    const count = writes(http).length;
    await user.click(element);
    await waitFor(() => expect(writes(http)).toHaveLength(count + 1));
    expect(armed).toBeNull();
    expect(writes(http).at(-1)).toEqual([method, url]);
  }
  return { http, state, tasks, definition, result, parent, runtimes, currentCompetency, clickWrite };
}

export async function openTask(user, server, task, { bound = false } = {}) {
  const region = screen.getByRole("region", { name: "Assessment attempt" });
  const row = within(region).getByText(`Task ${task.order}`).closest("li");
  if (bound) await user.click(within(row).getByRole("link", { name: "Continue task" }));
  else await server.clickWrite(user, within(row).getByRole("button", { name: "Start task" }), "post", taskUrl(task));
  await screen.findByRole("heading", { name: `Task ${task.order}` });
}

export function expectNoTaskFeedback() {
  const task = screen.getByRole("region", { name: "Assessment task" });
  expect(task.textContent).not.toMatch(/\bscore\b|\bcorrect\b|\bincorrect\b|performance|overall result|current German level|promot|new level/i);
}

export async function submitAndReturn(user, server, task, router) {
  const before = writes(server.http).length;
  await server.clickWrite(user, screen.getByRole("button", { name: "Submit task" }), "post", `${taskUrl(task)}/submit`);
  await screen.findByText("Status: Submitted");
  expect(router.state.location.pathname).toBe(taskPath(task));
  for (const input of screen.getAllByRole("radio")) expect(input).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Clear answer" })).not.toBeInTheDocument();
  expectNoTaskFeedback();
  expect(server.state.status).toBe("IN_PROGRESS");
  expect(server.state.settled).toBe(false);
  expect(writes(server.http)).toHaveLength(before + 1);
  expect(server.http.mock.calls.some(([config]) => [RESULT_URL, COMPETENCY_URL].includes(config.url))).toBe(false);
  await user.click(screen.getByRole("link", { name: "Continue assessment" }));
  await screen.findByText("Status: In progress");
  expect(router.state.location.pathname).toBe(attemptPath);
  expect(screen.getByRole("button", { name: "Submit assessment" })).toBeEnabled();
  expect(screen.queryByRole("link", { name: "View result" })).not.toBeInTheDocument();
  expect(writes(server.http)).toHaveLength(before + 1);
}

export async function expectOfficialResult(server, client) {
  await screen.findByText("Kết quả tổng thể: Đạt");
  expect(screen.getByText("Trình độ mục tiêu: B1")).toBeInTheDocument();
  const level = screen.getByRole("region", { name: "Trình độ tiếng Đức hiện tại" });
  await within(level).findByText("B2");
  const evidence = screen.getByRole("region", { name: "Kết quả đánh giá chính thức" });
  expect(within(evidence).getAllByRole("heading", { level: 3 }).map((item) => item.textContent))
    .toEqual(["Viết", "Nghe", "Đọc", "Nói"]);
  expect(server.result.componentResults.map((item) => item.skillDimension)).toEqual(["SPEAKING", "READING", "LISTENING", "WRITING"]);
  for (const card of within(evidence).getAllByRole("article")) {
    expect(within(card).getByText("Tỷ lệ thực hiện: 80%")).toBeInTheDocument();
    expect(within(card).getByText("Kết quả: Đạt")).toBeInTheDocument();
    expect(card.textContent).not.toMatch(/B1|B2|CEFR/);
  }
  const page = screen.getByRole("region", { name: "Trang kết quả đánh giá" });
  expect(page.textContent).not.toMatch(/promot|new level|achieved|mismatch|downgrade|recommend|next activity/i);
  expect(within(page).queryByRole("alert")).not.toBeInTheDocument();
  expect(within(page).queryByRole("button")).not.toBeInTheDocument();
  expect(client.getQueryData(RESULT_KEY)).toEqual(server.result);
  expect(client.getQueryData(COMPETENCY_KEY)).toEqual(competency({ currentLevel: "B2" }));
}
