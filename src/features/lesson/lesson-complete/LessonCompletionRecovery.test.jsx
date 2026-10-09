import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { mountSession, seedSession, loginResult, refreshResult } from "@/test/session-fixtures";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";
import { COURSE_ID, seedCourseState, expectCourseState } from "@/test/course-state-fixtures";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import LessonDetail from "../lesson-detail";
import CompleteLessonButton from "./components/CompleteLessonButton";
import useCompleteLesson from "./hooks/useCompleteLesson";

const lessonId = "lesson-one";
const lessonKey = ["courses", COURSE_ID, "lessons", lessonId];
const lessonPath = (id = lessonId, courseId = COURSE_ID) => `/my-learning/courses/${courseId}/lessons/${id}`;
const lessonUrl = `/me/courses/${COURSE_ID}/lessons/${lessonId}`;
const completeUrl = `${lessonUrl}/complete`;
const requests = (http) => http.mock.calls.map(([config]) => [config.method, config.url]);
const posts = (http) => requests(http).filter(([method, url]) => method === "post" && url === completeUrl);

function lesson(completed = false, id = lessonId) {
  return {
    id, completed, title: id === lessonId ? "Greetings" : "Next lesson",
    description: "Learn everyday German.", level: "A1", orderIndex: 1, estimatedMinutes: 10,
    previousLessonId: id === lessonId ? null : lessonId,
    nextLessonId: id === lessonId ? "next" : null,
    items: [{ id: "reading", type: "TEXT", title: "Reading",
      content: '<p onclick="alert(1)">Hallo <strong>zusammen</strong>.</p><script>alert(1)</script>' }],
  };
}

function refuse(config, status = 409, code = 6010) {
  throw new AxiosError("Private backend detail", AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code, message: "Private backend detail" },
  });
}

function unknown(config, outcome = AxiosError.ERR_NETWORK) {
  if (typeof outcome === "number") return refuse(config, outcome, 9999);
  throw new AxiosError("Private transport detail", outcome, config);
}

function setup({ complete = (config) => ok(config, { completedLessons: 1 }),
  read = (config) => ok(config, lesson(true)),
  load = (config) => ok(config, lesson(false, config.url.split("/").at(-1))),
  refresh, standalone = false, fixtureCaches = true, page } = {}) {
  seedSession();
  // Session-boundary tests must allow AuthProvider to clear the old identity's cache.
  const cache = fixtureCaches ? seedCourseState() : { client: new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity }, mutations: { retry: false },
  } }) };
  const onCompleted = vi.fn();
  function StandaloneButton() {
    const { courseId, lessonId: id } = useParams();
    return <CompleteLessonButton courseId={courseId} lesson={lesson(false, id)} onCompleted={onCompleted} />;
  }
  const http = vi.fn((config) => {
    if (config.method === "post" && config.url === completeUrl) {
      expect(JSON.parse(config.data)).toEqual({ studyMinutes: 10 });
      expect(config.validateStatus(200)).toBe(true);
      expect(config.validateStatus(201)).toBe(false);
      return complete(config);
    }
    if (config.method === "get" && config.url.startsWith("/me/courses/") && config.url.includes("/lessons/")) {
      if (config.headers["Cache-Control"] === "no-cache") return read(config);
      return load(config);
    }
    if (config.method === "post" && config.url === "/auth/refresh" && refresh) return refresh(config);
    throw new Error(`Unexpected completion request: ${config.method} ${config.url}`);
  });
  setHttpHandler(http);
  const app = mountSession([
    { path: "/my-learning/courses/:courseId/lessons/:lessonId",
      element: page ?? (standalone ? <StandaloneButton /> : <LessonDetail />) },
    { path: "/elsewhere", element: <h1>Elsewhere</h1> },
  ], { path: lessonPath(), client: cache.client });
  return { ...app, cache, http, onCompleted, user: userEvent.setup() };
}

async function clickComplete(app) {
  await app.user.click(await screen.findByRole("button", { name: "Complete lesson" }));
}

async function expectUncertain(app) {
  expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't confirm completion. It may still complete.");
  await waitFor(() => expect(app.client.isMutating()).toBe(0));
  expect(screen.getByRole("button", { name: "Complete lesson" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Check completion status" })).toBeEnabled();
  expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
  expect(app.router.state.location.pathname).toBe(lessonPath());
}

function expectContentAndNavigation() {
  expect(screen.getByRole("heading", { name: "Greetings", level: 1 })).toBeVisible();
  expect(screen.getByRole("article").querySelector("div").innerHTML).toBe("<p>Hallo <strong>zusammen</strong>.</p>");
  expect(screen.getByRole("button", { name: "Previous lesson" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next lesson" })).toBeEnabled();
}

describe("Learner lesson completion recovery", () => {
  it("confirms HTTP success through the production page, preserves content/navigation and refreshes evidence when reopened", async () => {
    let persisted = false;
    const app = setup({ complete: (config) => { persisted = true; return ok(config, { completedLessons: 1 }); },
      load: (config) => ok(config, lesson(persisted && config.url === lessonUrl, config.url.split("/").at(-1))) });
    await screen.findByRole("heading", { name: "Greetings" });
    const original = app.client.getQueryData(lessonKey);
    const unrelated = lesson(false, "other");
    app.client.setQueryData(["courses", COURSE_ID, "lessons", "other"], unrelated);
    app.client.setQueryData(["courses", COURSE_ID], { id: COURSE_ID });
    await clickComplete(app);
    expect(await screen.findByText("Lesson completed")).toBeVisible();
    expectContentAndNavigation();
    expectCourseState(app.cache, true);
    expect(app.client.getQueryData(lessonKey)).toEqual({ ...original, completed: true });
    expect(app.client.getQueryData(lessonKey).items).toBe(original.items);
    expect(app.client.getQueryState(lessonKey).isInvalidated).toBe(true);
    expect(app.client.getQueryState(["courses", COURSE_ID]).isInvalidated).toBe(true);
    expect(app.client.getQueryData(["courses", COURSE_ID, "lessons", "other"])).toBe(unrelated);
    expect(app.client.getQueryState(["courses", COURSE_ID, "lessons", "other"]).isInvalidated).toBe(false);
    expect(requests(app.http)).toEqual([["get", lessonUrl], ["post", completeUrl]]);
    expect(app.router.state.location.pathname).toBe(lessonPath());
    await app.user.click(screen.getByRole("button", { name: "Next lesson" }));
    await screen.findByRole("heading", { name: "Next lesson" });
    await app.user.click(screen.getByRole("button", { name: "Previous lesson" }));
    await screen.findByRole("heading", { name: "Greetings" });
    await waitFor(() => expect(requests(app.http).filter(([method, url]) => method === "get" && url === lessonUrl)).toHaveLength(2));
    expect(screen.getByText("Lesson completed")).toBeVisible();
    expect(posts(app.http)).toHaveLength(1);
  });

  it("shows pending UI and blocks repeated clicks without leaving the current lesson", async () => {
    const response = deferred(), started = deferred();
    const app = setup({ complete: (config) => { started.resolve(); return response.promise.then(() => ok(config)); } });
    await clickComplete(app);
    await started.promise;
    const button = screen.getByRole("button", { name: "Completing lesson…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expectContentAndNavigation();
    await app.user.dblClick(button);
    expect(posts(app.http)).toHaveLength(1);
    expect(app.router.state.location.pathname).toBe(lessonPath());
    await act(async () => response.resolve());
    await screen.findByText("Lesson completed");
  });

  it("locks direct same-tick handler calls before pending UI renders", async () => {
    let action;
    const response = deferred(), started = deferred();
    function Probe() {
      action = useCompleteLesson(COURSE_ID, lessonId);
      return <p>{action.phase}</p>;
    }
    const app = setup({ page: <Probe />, complete: (config) => {
      started.resolve(); return response.promise.then(() => ok(config));
    } });
    act(() => { action.handleComplete(10); action.handleComplete(10); });
    await started.promise;
    expect(posts(app.http)).toHaveLength(1);
    await act(async () => response.resolve());
    await waitFor(() => expect(action.phase).toBe("confirmed"));
    expectCourseState(app.cache, true);
  });

  it("recovers exact 409/6010 through the production LessonDetail only after a fresh matching completed response", async () => {
    const app = setup({ complete: (config) => refuse(config), read: (config) => {
      expect(config.url).toBe(lessonUrl);
      expect(config.refreshOnUnauthorized).toBe(false);
      expect(config._sessionGeneration).toBe(getSessionGeneration());
      expect(config.signal).toBeInstanceOf(AbortSignal);
      return ok(config, lesson(true));
    } });
    await clickComplete(app);
    await screen.findByText("Lesson completed");
    expectContentAndNavigation();
    expectCourseState(app.cache, true);
    expect(app.client.getQueryData(lessonKey).completed).toBe(true);
    expect(app.router.state.location.pathname).toBe(lessonPath());
    expect(requests(app.http)).toEqual([["get", lessonUrl], ["post", completeUrl], ["get", lessonUrl]]);
  });

  it("keeps exact 409/6010 uncertain without canonical completion evidence", async () => {
    const app = setup({ complete: (config) => refuse(config), read: (config) => ok(config, lesson(false)) });
    await clickComplete(app);
    await expectUncertain(app);
    expect(app.client.getQueryData(lessonKey).completed).toBe(false);
    expectCourseState(app.cache);
    expect(requests(app.http)).toEqual([["get", lessonUrl], ["post", completeUrl], ["get", lessonUrl]]);
  });

  it.each([AxiosError.ERR_NETWORK, "ECONNABORTED", 408, 500, 502, 503, 504])("recovers uncertain outcome %s using canonical completion without a second POST", async (outcome) => {
    const app = setup({ complete: (config) => unknown(config, outcome) });
    await clickComplete(app);
    await screen.findByText("Lesson completed");
    expectContentAndNavigation();
    expectCourseState(app.cache, true);
    expect(requests(app.http)).toEqual([["get", lessonUrl], ["post", completeUrl], ["get", lessonUrl]]);
  });

  it.each([
    ["incomplete", (config) => ok(config, lesson(false))],
    ["wrong lesson", (config) => ok(config, lesson(true, "other"))],
    ["missing ID", (config) => ok(config, { completed: true })],
    ["missing completed", (config) => ok(config, { id: lessonId })],
    ["string completed", (config) => ok(config, { id: lessonId, completed: "true" })],
    ["missing result", (config) => ok(config, undefined)],
    ["null result", (config) => ok(config, null)],
    ["malformed envelope", (config) => ({ ...ok(config), data: { unexpected: true } })],
    ["read 401", (config) => fail(config, 401)],
    ["read 403", (config) => fail(config, 403)],
    ["read 500", (config) => fail(config, 500)],
    ["read timeout", (config) => unknown(config, "ECONNABORTED")],
  ])("remains uncertain after an unknown POST and %s, with no automatic retry or false cache update", async (_, read) => {
    const app = setup({ complete: (config) => unknown(config), read });
    await clickComplete(app);
    await expectUncertain(app);
    expectContentAndNavigation();
    expect(app.client.getQueryData(lessonKey).completed).toBe(false);
    expect(app.client.getQueryState(lessonKey).isInvalidated).toBe(false);
    expectCourseState(app.cache);
    await app.user.click(screen.getByRole("button", { name: "Complete lesson" }));
    expect(requests(app.http)).toEqual([["get", lessonUrl], ["post", completeUrl], ["get", lessonUrl]]);
  });

  it("does not accept a stale positive query snapshot as recovery evidence", async () => {
    const app = setup({ standalone: true, complete: (config) => unknown(config), read: (config) => ok(config, lesson(false)) });
    const stale = lesson(true);
    app.client.setQueryData(lessonKey, stale);
    await clickComplete(app);
    await expectUncertain(app);
    expect(app.client.getQueryData(lessonKey)).toBe(stale);
    expect(app.client.getQueryState(lessonKey).isInvalidated).toBe(false);
    expect(app.onCompleted).not.toHaveBeenCalled();
    expect(requests(app.http)).toEqual([["post", completeUrl], ["get", lessonUrl]]);
  });

  it("does not let cached completed:true hide an uncertain operation on the production page", async () => {
    const response = deferred(), started = deferred();
    const app = setup({ complete: (config) => { started.resolve(); return response.promise.then(() => unknown(config)); },
      read: (config) => ok(config, lesson(false)) });
    await clickComplete(app);
    await started.promise;
    act(() => app.client.setQueryData(lessonKey, lesson(true)));
    expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Completing lesson…" })).toBeDisabled();
    await act(async () => response.resolve());
    await expectUncertain(app);
    expect(posts(app.http)).toHaveLength(1);
    expectCourseState(app.cache);
  });

  it("allows an explicit GET-only check to confirm later completion and blocks overlapping checks", async () => {
    let reads = 0;
    const response = deferred(), started = deferred();
    const app = setup({ complete: (config) => unknown(config, 503), read: (config) => {
      if (++reads === 1) return ok(config, lesson(false));
      started.resolve(); return response.promise.then(() => ok(config, lesson(true)));
    } });
    await clickComplete(app);
    await expectUncertain(app);
    await app.user.dblClick(screen.getByRole("button", { name: "Check completion status" }));
    await started.promise;
    expect(screen.getByRole("button", { name: "Checking completion…" })).toBeDisabled();
    expect(posts(app.http)).toHaveLength(1);
    expect(reads).toBe(2);
    await act(async () => response.resolve());
    await screen.findByText("Lesson completed");
    expect(app.client.getQueryData(lessonKey).completed).toBe(true);
    expectCourseState(app.cache, true);
    expect(requests(app.http)).toEqual([["get", lessonUrl], ["post", completeUrl], ["get", lessonUrl], ["get", lessonUrl]]);
  });

  it.each([[409, 8005], [409, 6011], [409, "6010"], [400, 6010], [403, 6010], [404, 9999], [410, 9999], [422, 9999]])("handles unrelated %s/%s safely without recovery, logging, alerts or an unhandled rejection", async (status, code) => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const unhandled = vi.fn();
    window.addEventListener("unhandledrejection", unhandled);
    try {
      const app = setup({ complete: (config) => refuse(config, status, code) });
      await clickComplete(app);
      const message = await screen.findByRole("alert");
      expect(message).not.toHaveTextContent("Private backend detail");
      if (code === 8005) expect(message).toHaveTextContent("Your enrollment is not active.");
      expect(screen.getByRole("button", { name: "Complete lesson" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Check completion status" })).not.toBeInTheDocument();
      expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
      expect(app.client.getQueryData(lessonKey).completed).toBe(false);
      expectCourseState(app.cache);
      expect(requests(app.http)).toEqual([["get", lessonUrl], ["post", completeUrl]]);
      await act(async () => {});
      expect(log).not.toHaveBeenCalled();
      expect(alert).not.toHaveBeenCalled();
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("unhandledrejection", unhandled);
    }
  });

  it("discards a pre-completion background read so old query data cannot undo canonical recovery", async () => {
    let loads = 0;
    const response = deferred(), started = deferred();
    const app = setup({ complete: (config) => unknown(config), load: (config) => {
      if (++loads === 1) return ok(config, lesson(false));
      started.resolve(); return response.promise.then(() => ok(config, lesson(false)));
    } });
    await screen.findByRole("heading", { name: "Greetings" });
    let oldRead;
    act(() => { oldRead = app.client.refetchQueries({ queryKey: lessonKey, exact: true }); });
    await started.promise;
    await clickComplete(app);
    await screen.findByText("Lesson completed");
    await act(async () => { response.resolve(); await oldRead; });
    expect(app.client.getQueryData(lessonKey).completed).toBe(true);
    expect(screen.getByText("Lesson completed")).toBeVisible();
    expectContentAndNavigation();
    expectCourseState(app.cache, true);
    expect(posts(app.http)).toHaveLength(1);
  });

  it.each(["logout", "account replacement", "same-user replacement"])("fences a delayed POST after %s without completion or new-session cache invalidation", async (boundary) => {
    const response = deferred(), started = deferred();
    const app = setup({ standalone: true, fixtureCaches: false, complete: (config) => {
      started.resolve(); return response.promise.then(() => ok(config));
    } });
    await clickComplete(app);
    await started.promise;
    await act(async () => {
      if (boundary === "logout") app.auth.current.logout();
      else app.auth.current.setSession(loginResult(boundary === "same-user replacement" ? "learner-a" : "learner-b"));
    });
    const newer = { ...lesson(false), sentinel: "new learner" };
    app.client.setQueryData(lessonKey, newer);
    const invalidate = vi.spyOn(app.client, "invalidateQueries");
    await act(async () => response.resolve());
    expect(app.client.getQueryData(lessonKey)).toBe(newer);
    expect(app.client.getQueryState(lessonKey).isInvalidated).toBe(false);
    expect(app.onCompleted).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(requests(app.http)).toEqual([["post", completeUrl]]);
    expect(app.router.state.location.pathname).toBe(lessonPath());
  });

  it.each(["logout", "account replacement", "same-user replacement"])("fences a delayed canonical GET after %s and cannot restore old completion evidence", async (boundary) => {
    const response = deferred(), started = deferred();
    const app = setup({ standalone: true, fixtureCaches: false, complete: (config) => refuse(config), read: (config) => {
      started.resolve(); return response.promise.then(() => ok(config, lesson(true)));
    } });
    await clickComplete(app);
    await started.promise;
    await act(async () => {
      if (boundary === "logout") app.auth.current.logout();
      else app.auth.current.setSession(loginResult(boundary === "same-user replacement" ? "learner-a" : "learner-b"));
    });
    const newer = { ...lesson(false), sentinel: "new session" };
    app.client.setQueryData(lessonKey, newer);
    const invalidate = vi.spyOn(app.client, "invalidateQueries");
    await act(async () => response.resolve());
    expect(app.client.getQueryData(lessonKey)).toBe(newer);
    expect(app.client.getQueryState(lessonKey).isInvalidated).toBe(false);
    expect(app.onCompleted).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(requests(app.http)).toEqual([["post", completeUrl], ["get", lessonUrl]]);
  });

  it.each(["POST", "GET"])("discards queued old-session handlers and late manual checks (%s)", async (kind) => {
    let action;
    function Probe() {
      action = useCompleteLesson(COURSE_ID, lessonId);
      return <p>{action.phase}</p>;
    }
    const response = deferred(), started = deferred();
    let reads = 0;
    const app = setup({ page: <Probe />, fixtureCaches: false,
      complete: (config) => kind === "POST" ? ok(config) : unknown(config), read: (config) => {
        if (++reads === 1) return ok(config, lesson(false));
        started.resolve(); return response.promise.then(() => ok(config, lesson(true)));
      } });
    const oldHandler = action.handleComplete;
    if (kind === "POST") {
      act(() => { oldHandler(10); app.auth.current.setSession(loginResult()); });
      await act(async () => {});
      expect(app.http).not.toHaveBeenCalled();
    } else {
      act(() => action.handleComplete(10));
      await waitFor(() => expect(action.phase).toBe("uncertain"));
      await waitFor(() => expect(app.client.isMutating()).toBe(0));
      act(() => action.checkCompletion());
      await started.promise;
      await act(async () => app.auth.current.setSession(loginResult()));
      const newer = lesson(false);
      app.client.setQueryData(lessonKey, newer);
      const invalidate = vi.spyOn(app.client, "invalidateQueries");
      await act(async () => response.resolve());
      expect(app.client.getQueryData(lessonKey)).toBe(newer);
      expect(invalidate).not.toHaveBeenCalled();
      expect(requests(app.http)).toEqual([["post", completeUrl], ["get", lessonUrl], ["get", lessonUrl]]);
    }
    const count = app.http.mock.calls.length;
    act(() => oldHandler(10));
    await act(async () => {});
    expect(app.http).toHaveBeenCalledTimes(count);
    expect(action.phase).toBe("idle");
  });

  it.each([
    ["another lesson", lessonPath("next")],
    ["another course", lessonPath(lessonId, "other-course")],
    ["unmount", "/elsewhere"],
  ])("discards late POST success after %s", async (_, destination) => {
    const response = deferred(), started = deferred();
    const app = setup({ complete: (config) => { started.resolve(); return response.promise.then(() => ok(config)); } });
    await clickComplete(app);
    await started.promise;
    await act(async () => { await app.router.navigate(destination); });
    const invalidate = vi.spyOn(app.client, "invalidateQueries");
    await act(async () => response.resolve());
    expect(app.router.state.location.pathname).toBe(destination);
    expect(app.client.getQueryData(lessonKey).completed).toBe(false);
    expect(app.client.getQueryState(lessonKey).isInvalidated).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
    expectCourseState(app.cache);
    expect(posts(app.http)).toHaveLength(1);
  });

  it.each([
    ["another lesson", lessonPath("next")],
    ["another course", lessonPath(lessonId, "other-course")],
    ["unmount", "/elsewhere"],
  ])("discards a late reconciliation GET after %s", async (_, destination) => {
    const response = deferred(), started = deferred();
    const app = setup({ complete: (config) => refuse(config), read: (config) => {
      started.resolve(); return response.promise.then(() => ok(config, lesson(true)));
    } });
    await clickComplete(app);
    await started.promise;
    await act(async () => { await app.router.navigate(destination); });
    const invalidate = vi.spyOn(app.client, "invalidateQueries");
    await act(async () => response.resolve());
    expect(app.router.state.location.pathname).toBe(destination);
    expect(app.client.getQueryData(lessonKey).completed).toBe(false);
    expect(app.client.getQueryState(lessonKey).isInvalidated).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
    expectCourseState(app.cache);
    expect(posts(app.http)).toHaveLength(1);
  });

  it("ignores a saved handler after the same hook instance changes course/lesson", async () => {
    let action;
    function Probe() {
      const { courseId, lessonId: id } = useParams();
      action = useCompleteLesson(courseId, id);
      return <p>{action.phase}</p>;
    }
    const app = setup({ page: <Probe /> });
    const oldHandler = action.handleComplete;
    await act(async () => { await app.router.navigate(lessonPath("next", "other-course")); });
    act(() => oldHandler(10));
    await act(async () => {});
    expect(app.http).not.toHaveBeenCalled();
    expectCourseState(app.cache);
  });

  it("cannot start a new operation through a saved handler after component unmount", async () => {
    let action;
    function Probe() {
      action = useCompleteLesson(COURSE_ID, lessonId);
      return <p>{action.phase}</p>;
    }
    const app = setup({ page: <Probe /> });
    const oldHandler = action.handleComplete;
    await act(async () => { await app.router.navigate("/elsewhere"); });
    act(() => oldHandler(10));
    await act(async () => {});
    expect(app.http).not.toHaveBeenCalled();
    expect(app.client.getMutationCache().getAll()).toEqual([]);
    expectCourseState(app.cache);
  });

  it.each([403, "ECONNABORTED"])("preserves session termination when the existing 401 refresh fails (%s)", async (outcome) => {
    const app = setup({ standalone: true, fixtureCaches: false, complete: (config) => fail(config, 401),
      refresh: (config) => unknown(config, outcome) });
    await clickComplete(app);
    await waitFor(() => expect(app.auth.current.isAuthenticated).toBe(false));
    expect(app.onCompleted).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
    expect(requests(app.http)).toEqual([["post", completeUrl], ["post", "/auth/refresh"]]);
  });

  it("preserves terminal 401 handling after the existing auth refresh without completion reconciliation", async () => {
    const app = setup({ standalone: true, fixtureCaches: false, complete: (config) => fail(config, 401),
      refresh: (config) => ok(config, refreshResult()) });
    await clickComplete(app);
    await waitFor(() => expect(app.auth.current.isAuthenticated).toBe(false));
    expect(app.onCompleted).not.toHaveBeenCalled();
    expect(screen.queryByText("Lesson completed")).not.toBeInTheDocument();
    expect(requests(app.http)).toEqual([["post", completeUrl], ["post", "/auth/refresh"], ["post", completeUrl]]);
  });
});
