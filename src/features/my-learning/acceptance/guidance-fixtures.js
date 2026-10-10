import { afterEach, expect } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import { getAccessToken } from "@/shared/auth/token";
import { ok } from "@/test/http";
import { assessmentHttp } from "@/features/assessment/test/assessment-app";
import { assessmentDetail } from "@/features/assessment/test/fixtures";
import {
  ATTEMPT_ID, attemptUrl, journeyUrl, journey, courseSnapshot, liveAttempt, resumedAttempt,
} from "@/features/assessment/test/attempt-fixtures";
import {
  TASK_ID, TASK_URL, TASK_SUBMIT_URL, startedTask, taskRuntime, submittedTask, SUBMITTED_AT,
} from "@/features/assessment/test/task-fixtures";
import { finalResult, FINAL_URL } from "@/features/assessment/test/final-submit-fixtures";
import { learningJourneyKey } from "@/features/assessment/attempt/hooks/useLearningJourney";
import { learningDirectionKey } from "../guidance/hooks/useLearningDirection";
import { nextActivityKey } from "../guidance/hooks/useNextActivity";

export const COURSE_ID = "guidance-course";
export const LESSON_IDS = ["lesson-1", "lesson-2"];
export const lessonUrl = (id) => `/me/courses/${COURSE_ID}/lessons/${id}`;
export const lessonPath = (id) => `/my-learning/courses/${COURSE_ID}/lessons/${id}`;
export const DEFINITION_URL = `${attemptUrl}/assessment`;
export const DIRECTION_URL = "/me/learning-direction";
export const ACTIVITY_URL = "/me/next-activity";
export const TRIAD_URLS = [journeyUrl, DIRECTION_URL, ACTIVITY_URL];
export const TRIAD_KEYS = [learningJourneyKey, learningDirectionKey, nextActivityKey];
export const requestWindow = (http, from = 0) => http.mock.calls.slice(from).map(([config]) => [
  config.method, config.url, config.data === undefined ? undefined : JSON.parse(config.data),
]);

const audits = [];
afterEach(() => {
  for (const audit of audits.splice(0)) {
    expect(audit.unexpected).toEqual([]);
    expect(audit.armed).toBeNull();
  }
});

const assessmentDirection = { type: "RESUME_ASSESSMENT", target: { assessmentAttemptId: ATTEMPT_ID } };
const openAssessment = { type: "OPEN_ASSESSMENT", target: { assessmentAttemptId: ATTEMPT_ID } };
const courseDirection = { type: "CONTINUE_COURSE", target: { courseId: COURSE_ID } };
const openLesson = (id) => ({ type: "OPEN_LESSON", target: { courseId: COURSE_ID, lessonId: id } });
const progress = (completedLessons, totalStudyMinutes) => ({
  completedLessons, totalLessons: 2, completionPercentage: completedLessons * 50, totalStudyMinutes,
});
const course = (value) => courseSnapshot({ courseId: COURSE_ID, progress: value });
const models = (attempts, courses, direction, activity) => ({
  journey: journey(attempts, { currentLevel: "A2", courses }), direction, activity,
});

// Explicit scenario response snapshots represent verified Backend transitions.
// No Course/Assessment priority, lesson selection or child-selection algorithm runs here.
export function guidanceServer(scenario) {
  expect(["assessment-child", "finalization-handoff", "course-progression"]).toContain(scenario);
  const definition = assessmentDetail();
  const tasks = definition.components.flatMap((component) => component.tasks);
  const runtimes = new Map();
  const initialProgress = progress(0, 0);
  const state = {
    phase: "initial", parentStatus: "IN_PROGRESS", enrollmentStatus: "IN_PROGRESS",
    progress: initialProgress, completedLessons: [],
  };
  if (scenario === "finalization-handoff") {
    for (const task of tasks) runtimes.set(task.taskId, taskRuntime({
      taskId: task.taskId, quizAttemptId: `quiz-${task.taskId}`,
      quizRevisionId: task.quizRevisionId, status: "SUBMITTED", submittedAt: SUBMITTED_AT,
    }));
  }
  const snapshots = scenario === "assessment-child" ? {
    initial: models([liveAttempt()], [], assessmentDirection, openAssessment),
    started: models([liveAttempt()], [], assessmentDirection, {
      type: "RESUME_ASSESSMENT_TASK", target: {
        assessmentAttemptId: ATTEMPT_ID, taskId: TASK_ID, quizAttemptId: "quiz-owned-42",
      },
    }),
    submitted: models([liveAttempt()], [], assessmentDirection, openAssessment),
  } : scenario === "finalization-handoff" ? {
    initial: models([liveAttempt()], [course(initialProgress)], assessmentDirection, openAssessment),
    finalized: models([], [course(initialProgress)], courseDirection, openLesson(LESSON_IDS[0])),
  } : {
    initial: models([], [course(initialProgress)], courseDirection, openLesson(LESSON_IDS[0])),
    firstCompleted: models([], [course(progress(1, 10))], courseDirection, openLesson(LESSON_IDS[1])),
    courseCompleted: models([], [], { type: "DISCOVER_COURSE", target: null }, { type: "NONE", target: null }),
  };
  const currentModels = () => structuredClone(snapshots[state.phase]);
  const parent = () => resumedAttempt({
    status: state.parentStatus,
    taskAttempts: [...runtimes.values()].map(({ taskId, quizAttemptId }) => ({ taskId, quizAttemptId })),
  });
  const lessons = LESSON_IDS.map((id, index) => ({
    id, title: index === 0 ? "Greetings in German" : "Introducing yourself",
    description: "Practice a short everyday conversation.", level: "A1",
    orderIndex: index + 1, estimatedMinutes: index === 0 ? 10 : 15, completed: false,
    previousLessonId: index === 0 ? null : LESSON_IDS[0],
    nextLessonId: index === 0 ? LESSON_IDS[1] : null,
    items: [{ id: `text-${id}`, type: "TEXT", title: "Conversation practice",
      content: "<p>Read the dialogue aloud and practice with a partner.</p>" }],
  }));
  const audit = { unexpected: [], armed: null };
  audits.push(audit);
  let allowedReads = new Set(TRIAD_URLS);
  function unexpected(config) {
    const message = `Unexpected guidance acceptance request: ${config.method} ${config.url}`;
    audit.unexpected.push(message);
    throw new Error(message);
  }
  const http = assessmentHttp((config) => {
    expect(config.baseURL).toBe("http://localhost:8080/deutsch-hub/api/v1");
    expect(config.headers.Authorization).toBe(`Bearer ${getAccessToken()}`);
    const respond = (value) => ok(config, structuredClone(value));
    if (config.method === "get") {
      expect(config.data).toBeUndefined();
      if (!allowedReads.has(config.url)) return unexpected(config);
      const current = currentModels();
      if (config.url === journeyUrl) return respond(current.journey);
      if (config.url === DIRECTION_URL) return respond(current.direction);
      if (config.url === ACTIVITY_URL) return respond(current.activity);
      if (scenario !== "course-progression" && config.url === attemptUrl) return respond(parent());
      if (scenario !== "course-progression" && config.url === DEFINITION_URL) return respond(definition);
      if (scenario === "assessment-child" && config.url === TASK_URL && runtimes.has(TASK_ID)) {
        return respond(runtimes.get(TASK_ID));
      }
      const lesson = lessons.find((item) => config.url === lessonUrl(item.id));
      if (scenario === "course-progression" && lesson) return respond({
        ...lesson, completed: state.completedLessons.includes(lesson.id),
      });
      return unexpected(config);
    }
    const actual = {
      method: config.method, url: config.url,
      body: config.data === undefined ? undefined : JSON.parse(config.data),
    };
    if (!audit.armed || actual.method !== audit.armed.method || actual.url !== audit.armed.url) return unexpected(config);
    expect(actual).toEqual(audit.armed);
    audit.armed = null;
    if (scenario === "assessment-child" && config.method === "post" && config.url === TASK_URL) {
      expect(state.phase).toBe("initial");
      runtimes.set(TASK_ID, taskRuntime());
      state.phase = "started";
      return respond(startedTask());
    }
    if (scenario === "assessment-child" && config.method === "post" && config.url === TASK_SUBMIT_URL) {
      expect(state.phase).toBe("started");
      Object.assign(runtimes.get(TASK_ID), { status: "SUBMITTED", submittedAt: SUBMITTED_AT });
      state.phase = "submitted";
      return respond(submittedTask());
    }
    if (scenario === "finalization-handoff" && config.method === "post" && config.url === FINAL_URL) {
      expect(state.phase).toBe("initial");
      expect(tasks.every((task) => runtimes.get(task.taskId)?.status === "SUBMITTED")).toBe(true);
      state.parentStatus = "COMPLETED";
      state.phase = "finalized";
      return respond(finalResult());
    }
    if (scenario === "course-progression" && config.method === "post") {
      const lesson = lessons.find((item) => config.url === `${lessonUrl(item.id)}/complete`);
      if (!lesson) return unexpected(config);
      expect(actual.body).toEqual({ studyMinutes: lesson.estimatedMinutes });
      if (lesson.id === LESSON_IDS[0]) {
        expect(state.phase).toBe("initial");
        state.progress = progress(1, 10);
        state.phase = "firstCompleted";
      } else {
        expect(state.phase).toBe("firstCompleted");
        state.progress = progress(2, 25);
        state.enrollmentStatus = "COMPLETED";
        state.phase = "courseCompleted";
      }
      state.completedLessons.push(lesson.id);
      return respond(state.progress);
    }
    return unexpected(config);
  }, {
    allowTaskExecution: scenario === "assessment-child",
    allowTaskSubmit: scenario === "assessment-child",
    allowFinalSubmit: scenario === "finalization-handoff",
    allowLessonReads: scenario === "course-progression",
    allowLessonComplete: scenario === "course-progression",
  });

  function allowReads(urls) { allowedReads = new Set(urls); }
  async function clickWrite(user, element, url, { body, reads = [] } = {}) {
    expect(audit.armed).toBeNull();
    allowReads(reads);
    audit.armed = { method: "post", url, body };
    const from = http.mock.calls.length;
    await user.click(element);
    await waitFor(() => expect(audit.armed).toBeNull());
    await waitFor(() => expect(requestWindow(http, from).filter(([method]) => method !== "get")).toEqual([
      ["post", url, body],
    ]));
    return from;
  }
  return { http, state, definition, tasks, runtimes, lessons, parent, currentModels, allowReads, clickWrite };
}

export function captureGuidance(client) {
  return TRIAD_KEYS.map((key) => ({
    key, query: client.getQueryCache().find({ queryKey: key, exact: true }),
    data: client.getQueryData(key), value: structuredClone(client.getQueryData(key)),
  }));
}

export function expectGuidanceStaleness(client, before, invalidated) {
  before.forEach(({ key, query, data, value }, index) => {
    expect(client.getQueryCache().find({ queryKey: key, exact: true })).toBe(query);
    expect(client.getQueryData(key)).toBe(data);
    expect(client.getQueryData(key)).toEqual(value);
    expect(client.getQueryState(key).isInvalidated).toBe(invalidated[index]);
  });
}

export async function expectDashboard(server, app, from, label, text, href, originalQueries) {
  const region = screen.getByRole("region", { name: "Hướng dẫn học tập" });
  const guidance = within(region);
  await guidance.findByRole("link", { name: label, exact: true });
  const canonical = server.currentModels();
  await waitFor(() => {
    TRIAD_KEYS.forEach((key, index) => {
      expect(app.client.getQueryState(key).fetchStatus).toBe("idle");
      expect(app.client.getQueryData(key)).toEqual([canonical.journey, canonical.direction, canonical.activity][index]);
      expect(app.client.getQueryState(key).isInvalidated).toBe(false);
      if (originalQueries) expect(app.client.getQueryCache().find({ queryKey: key, exact: true })).toBe(originalQueries[index].query);
    });
  });
  expect(app.router.state.location.pathname).toBe("/my-learning");
  expect(guidance.getByRole("heading", { name: "Hướng dẫn học tập" })).toBeVisible();
  expect(guidance.getByText(text)).toBeVisible();
  expect(guidance.getAllByRole("link")).toHaveLength(1);
  expect(guidance.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
  expect(requestWindow(server.http, from).sort()).toEqual(TRIAD_URLS.map((url) => ["get", url, undefined]).sort());
}

export async function returnToDashboard(user, server) {
  server.allowReads(TRIAD_URLS);
  const from = server.http.mock.calls.length;
  const header = screen.getByRole("navigation", { name: "Điều hướng chính" }).closest("header");
  await user.click(within(header).getByRole("link", { name: "Học tập của tôi", exact: true }));
  return from;
}

export function expectNoHiddenGuidance(server, from) {
  expect(requestWindow(server.http, from).filter(([, url]) => TRIAD_URLS.includes(url))).toEqual([]);
}
