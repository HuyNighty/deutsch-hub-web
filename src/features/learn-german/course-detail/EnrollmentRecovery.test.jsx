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
import { CourseAction } from "./components/CourseAction";
import { useEnrollAction } from "./hooks/useEnrollAction";

const publicPath = `/learn-german/courses/${COURSE_ID}`;
const coursePath = `/my-learning/courses/${COURSE_ID}`;
const enrollUrl = `/courses/${COURSE_ID}/enroll`;
const viewerUrl = `/courses/${COURSE_ID}/viewer`;
const viewer = (enrollmentStatus = "ENROLLED", enrolled = true) => ({
  id: COURSE_ID, enrolled, enrollmentStatus, title: "German Basics", sections: [],
});
const requests = (http) => http.mock.calls.map(([config]) => [config.method, config.url]);

function refuse(config, status = 409, code = 50004) {
  throw new AxiosError("Private backend detail", AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code, message: "Private backend detail" },
  });
}

function unknown(config, outcome) {
  if (typeof outcome === "number") return refuse(config, outcome, 9999);
  throw new AxiosError("Private transport detail", outcome, config);
}

function CoursePage() {
  const { courseId } = useParams();
  return <>
    <h1>German Basics</h1>
    <p>Learn everyday German.</p>
    <CourseAction courseId={courseId} enrollmentStatus={null} />
  </>;
}

function setup({ enroll = (config) => ok(config), read = (config) => ok(config, viewer()),
  refresh, anonymous = false, sessionBoundary = false, page = <CoursePage /> } = {}) {
  if (!anonymous) seedSession();
  // Course-state fixtures deliberately forbid cache clearing; auth boundary tests require it.
  const cache = anonymous || sessionBoundary
    ? { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }
    : seedCourseState();
  const http = vi.fn((config) => {
    if (config.method === "post" && config.url === enrollUrl) return enroll(config);
    if (config.method === "get" && config.url === viewerUrl) return read(config);
    if (config.method === "post" && config.url === "/auth/refresh" && refresh) return refresh(config);
    throw new Error(`Unexpected enrollment request: ${config.method} ${config.url}`);
  });
  setHttpHandler(http);
  const app = mountSession([
    { path: "/learn-german/courses/:courseId", element: page },
    { path: coursePath, element: <h1>Course destination</h1> },
    { path: "/login", element: <h1>Login destination</h1> },
  ], { path: publicPath, client: cache.client });
  return { ...app, cache, http, user: userEvent.setup() };
}

async function enroll(user) {
  await user.click(screen.getByRole("button", { name: "Đăng ký khóa học" }));
}

async function expectUncertain(app) {
  expect(await screen.findByRole("alert")).toHaveTextContent("Chưa thể xác nhận bạn đã đăng ký khóa học hay chưa. Việc đăng ký có thể đã được ghi nhận. Hãy kiểm tra lại trạng thái đăng ký.");
  await waitFor(() => expect(app.client.isMutating()).toBe(0));
  expect(screen.getByRole("button", { name: "Đăng ký khóa học" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Kiểm tra trạng thái đăng ký" })).toBeEnabled();
  expect(app.router.state.location.pathname).toBe(publicPath);
}

describe("Learner enrollment recovery", () => {
  it("confirms HTTP 200, invalidates existing viewer/learning caches and navigates without a viewer check", async () => {
    const app = setup({ enroll: (config) => {
      expect(config.validateStatus(200)).toBe(true);
      expect(config.validateStatus(201)).toBe(false);
      expect(config.data).toBeUndefined();
      return ok(config, { courseId: COURSE_ID, enrollmentStatus: "ENROLLED" });
    } });
    const snapshot = viewer(null, false);
    app.client.setQueryData(["courses", COURSE_ID], snapshot);
    app.client.setQueryData(["courses", "other-course"], { sentinel: "other viewer" });
    await enroll(app.user);
    await screen.findByRole("heading", { name: "Course destination" });
    expectCourseState(app.cache, true);
    expect(app.client.getQueryData(["courses", COURSE_ID])).toBe(snapshot);
    expect(app.client.getQueryState(["courses", COURSE_ID]).isInvalidated).toBe(true);
    expect(app.client.getQueryState(["courses", "other-course"]).isInvalidated).toBe(false);
    expect(app.router.state.historyAction).toBe("REPLACE");
    expect(requests(app.http)).toEqual([["post", enrollUrl]]);
  });

  it("shows pending UI, preserves course context and blocks repeated clicks until confirmation", async () => {
    const response = deferred(), started = deferred();
    const app = setup({ enroll: (config) => { started.resolve(); return response.promise.then(() => ok(config)); } });
    await enroll(app.user);
    await started.promise;
    const button = screen.getByRole("button", { name: "Đang đăng ký khóa học…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("heading", { name: "German Basics" })).toBeVisible();
    expect(screen.getByText("Learn everyday German.")).toBeVisible();
    await app.user.dblClick(button);
    expect(requests(app.http)).toEqual([["post", enrollUrl]]);
    await act(async () => response.resolve());
    await screen.findByRole("heading", { name: "Course destination" });
  });

  it("fences direct same-tick hook invocations before React can render pending UI", async () => {
    let action;
    const response = deferred(), started = deferred();
    function Probe() {
      action = useEnrollAction(COURSE_ID);
      return <p>{action.phase}</p>;
    }
    const app = setup({ page: <Probe />, enroll: (config) => {
      started.resolve();
      return response.promise.then(() => ok(config));
    } });
    act(() => { action.handleEnroll(); action.handleEnroll(); });
    await started.promise;
    expect(requests(app.http)).toEqual([["post", enrollUrl]]);
    await act(async () => response.resolve());
    await screen.findByRole("heading", { name: "Course destination" });
  });

  it.each(["ENROLLED", "IN_PROGRESS", "COMPLETED"])("recovers duplicate 50004 only after one fresh %s viewer response", async (status) => {
    const app = setup({ enroll: (config) => refuse(config), read: (config) => {
      expect(config.headers["Cache-Control"]).toBe("no-cache");
      expect(config.refreshOnUnauthorized).toBe(false);
      expect(config._sessionGeneration).toBe(getSessionGeneration());
      return ok(config, viewer(status));
    } });
    await enroll(app.user);
    await screen.findByRole("heading", { name: "Course destination" });
    expectCourseState(app.cache, true);
    expect(app.router.state.location.pathname).toBe(coursePath);
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl]]);
  });

  it.each(["DROPPED", "EXPIRED"])("does not grant access for a duplicate with an existing %s enrollment", async (status) => {
    const app = setup({ enroll: (config) => refuse(config), read: (config) => ok(config, viewer(status)) });
    await enroll(app.user);
    expect(await screen.findByRole("alert")).toHaveTextContent(`Trạng thái đăng ký của bạn là ${status}. Hiện không thể truy cập khóa học.`);
    expect(screen.getByText("Không khả dụng", { exact: true })).toBeVisible();
    expect(screen.getByRole("button", { name: "Đăng ký khóa học" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Tiếp tục học" })).not.toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe(publicPath);
    expectCourseState(app.cache);
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl]]);
  });

  it.each([AxiosError.ERR_NETWORK, "ECONNABORTED", 408, 500, 502, 503, 504])("reconciles unknown outcome %s without automatically repeating the POST", async (outcome) => {
    const app = setup({ enroll: (config) => unknown(config, outcome) });
    await enroll(app.user);
    await screen.findByRole("heading", { name: "Course destination" });
    expectCourseState(app.cache, true);
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl]]);
  });

  it.each([
    ["read 401", (config) => fail(config, 401)],
    ["read 403", (config) => fail(config, 403)],
    ["read 500", (config) => fail(config, 500)],
    ["read timeout", (config) => unknown(config, "ECONNABORTED")],
    ["negative read", (config) => ok(config, viewer(null, false))],
    ["contradictory read", (config) => ok(config, viewer("ENROLLED", false))],
    ["missing enrolled field", (config) => ok(config, { id: COURSE_ID, enrollmentStatus: "ENROLLED" })],
    ["unknown status", (config) => ok(config, viewer("OTHER"))],
    ["wrong course", (config) => ok(config, { ...viewer(), id: "other-course" })],
    ["missing result", (config) => ok(config, undefined)],
  ])("remains uncertain after an unknown POST and %s, ignoring stale positive cache data", async (_, read) => {
    const app = setup({ enroll: (config) => unknown(config, AxiosError.ERR_NETWORK), read });
    const stale = viewer("COMPLETED");
    app.client.setQueryData(["courses", COURSE_ID], stale);
    await enroll(app.user);
    await expectUncertain(app);
    expect(app.client.getQueryData(["courses", COURSE_ID])).toBe(stale);
    expect(app.client.getQueryState(["courses", COURSE_ID]).isInvalidated).toBe(false);
    expectCourseState(app.cache);
    await app.user.click(screen.getByRole("button", { name: "Đăng ký khóa học" }));
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl]]);
  });

  it("does not treat duplicate 50004 itself or a negative viewer read as successful enrollment", async () => {
    const app = setup({ enroll: (config) => refuse(config), read: (config) => ok(config, viewer(null, false)) });
    await enroll(app.user);
    await expectUncertain(app);
    expectCourseState(app.cache);
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl]]);
  });

  it("checks again explicitly after a negative read, blocks overlapping checks and never posts again", async () => {
    const response = deferred(), started = deferred();
    let reads = 0;
    const app = setup({ enroll: (config) => unknown(config, 503), read: (config) => {
      if (++reads === 1) return ok(config, viewer(null, false));
      started.resolve();
      return response.promise.then(() => ok(config, viewer("COMPLETED")));
    } });
    await enroll(app.user);
    await expectUncertain(app);
    const check = screen.getByRole("button", { name: "Kiểm tra trạng thái đăng ký" });
    await app.user.dblClick(check);
    await started.promise;
    expect(screen.getByRole("button", { name: "Đang kiểm tra trạng thái đăng ký…" })).toBeDisabled();
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl], ["get", viewerUrl]]);
    await act(async () => response.resolve());
    await screen.findByRole("heading", { name: "Course destination" });
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl], ["get", viewerUrl]]);
  });

  it.each([
    [400, 50004, "Không thể gửi yêu cầu đăng ký khóa học. Vui lòng kiểm tra thông tin khóa học và thử lại."],
    [403, 50004, "Bạn không có quyền đăng ký khóa học này."],
    [404, 50004, "Khóa học này hiện không khả dụng để đăng ký."],
    [410, 9999, "Khóa học này hiện không khả dụng để đăng ký."],
    [409, 50005, "Không thể hoàn tất đăng ký vì trạng thái khóa học đã thay đổi."],
    [409, "50004", "Không thể hoàn tất đăng ký vì trạng thái khóa học đã thay đổi."],
    [422, 9999, "Không thể gửi yêu cầu đăng ký khóa học. Vui lòng kiểm tra thông tin khóa học và thử lại."],
    [418, 9999, "Không thể hoàn tất đăng ký khóa học. Vui lòng thử lại."],
  ])("does not recover unrelated HTTP %s / code %s or expose backend detail", async (status, code, expected) => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const app = setup({ enroll: (config) => refuse(config, status, code) });
    await enroll(app.user);
    const message = await screen.findByRole("alert");
    expect(message).toHaveTextContent(expected);
    expect(message).not.toHaveTextContent("Private backend detail");
    expect(screen.getByRole("button", { name: "Đăng ký khóa học" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Kiểm tra trạng thái đăng ký" })).not.toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe(publicPath);
    expectCourseState(app.cache);
    expect(requests(app.http)).toEqual([["post", enrollUrl]]);
    expect(log).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
  });

  it("shows the approved confirmed/opening label while existing cache cancellation is pending", async () => {
    const app = setup();
    const cancellation = deferred();
    vi.spyOn(app.client, "cancelQueries").mockImplementation(() => cancellation.promise);
    await enroll(app.user);
    const opening = await screen.findByRole("button", { name: "Đã xác nhận đăng ký. Đang mở khóa học…" });
    expect(opening).toBeDisabled();
    expect(opening).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(requests(app.http)).toEqual([["post", enrollUrl]]);
    expect(app.router.state.location.pathname).toBe(publicPath);
    await act(async () => cancellation.resolve());
    await screen.findByRole("heading", { name: "Course destination" });
    expectCourseState(app.cache, true);
  });

  it("preserves anonymous Login returnTo and performs no mutation or viewer reconciliation", async () => {
    const app = setup({ anonymous: true });
    await act(async () => {});
    await enroll(app.user);
    await screen.findByRole("heading", { name: "Login destination" });
    expect(app.router.state.location.state).toEqual({ returnTo: publicPath });
    expect(app.http).not.toHaveBeenCalled();
    expect(app.client.getMutationCache().getAll()).toEqual([]);
  });

  it.each([403, "ECONNABORTED"])("preserves session termination when a known 401 cannot refresh (%s), without reconciliation", async (outcome) => {
    const app = setup({ sessionBoundary: true, enroll: (config) => fail(config, 401),
      refresh: (config) => unknown(config, outcome) });
    await enroll(app.user);
    await waitFor(() => expect(app.auth.current.isAuthenticated).toBe(false));
    expect(app.router.state.location.pathname).toBe(publicPath);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["post", "/auth/refresh"]]);
    await enroll(app.user);
    await screen.findByRole("heading", { name: "Login destination" });
    expect(app.router.state.location.state).toEqual({ returnTo: publicPath });
    expect(app.http).toHaveBeenCalledTimes(2);
  });

  it("preserves terminal 401 handling after the existing auth refresh, without viewer recovery", async () => {
    const app = setup({ sessionBoundary: true, enroll: (config) => fail(config, 401),
      refresh: (config) => ok(config, refreshResult()) });
    await enroll(app.user);
    await waitFor(() => expect(app.auth.current.isAuthenticated).toBe(false));
    expect(app.router.state.location.pathname).toBe(publicPath);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["post", "/auth/refresh"], ["post", enrollUrl]]);
  });

  it.each(["logout", "replacement", "same-user replacement"])("ignores delayed POST success after %s without navigation, cache writes or viewer reads", async (boundary) => {
    const response = deferred(), started = deferred();
    const app = setup({ sessionBoundary: true, enroll: (config) => { started.resolve(); return response.promise.then(() => ok(config)); } });
    await enroll(app.user);
    await started.promise;
    await act(async () => {
      if (boundary === "logout") app.auth.current.logout();
      else app.auth.current.setSession(loginResult(boundary === "same-user replacement" ? "learner-a" : "learner-b"));
    });
    const newer = { sentinel: "new session" };
    app.client.setQueryData(["my-courses"], newer);
    const invalidate = vi.spyOn(app.client, "invalidateQueries");
    await act(async () => response.resolve());
    expect(app.router.state.location.pathname).toBe(publicPath);
    expect(app.client.getQueryData(["my-courses"])).toBe(newer);
    expect(app.client.getQueryState(["my-courses"]).isInvalidated).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(requests(app.http)).toEqual([["post", enrollUrl]]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each(["logout", "replacement", "same-user replacement"])("ignores a delayed canonical read after %s and never restores old learner data", async (boundary) => {
    const response = deferred(), started = deferred();
    const app = setup({ sessionBoundary: true, enroll: (config) => refuse(config), read: (config) => {
      started.resolve();
      return response.promise.then(() => ok(config, viewer("COMPLETED")));
    } });
    await enroll(app.user);
    await started.promise;
    await act(async () => {
      if (boundary === "logout") app.auth.current.logout();
      else app.auth.current.setSession(loginResult(boundary === "same-user replacement" ? "learner-a" : "learner-b"));
    });
    const newer = { sentinel: "new viewer" };
    app.client.setQueryData(["courses", COURSE_ID], newer);
    const invalidate = vi.spyOn(app.client, "invalidateQueries");
    await act(async () => response.resolve());
    expect(app.router.state.location.pathname).toBe(publicPath);
    expect(app.client.getQueryData(["courses", COURSE_ID])).toBe(newer);
    expect(app.client.getQueryState(["courses", COURSE_ID]).isInvalidated).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(requests(app.http)).toEqual([["post", enrollUrl], ["get", viewerUrl]]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not dispatch a queued old-session enrollment or reuse an old handler after session replacement", async () => {
    let action;
    function Probe() {
      action = useEnrollAction(COURSE_ID);
      return <p>{action.phase}</p>;
    }
    const app = setup({ sessionBoundary: true, page: <Probe /> });
    const oldHandle = action.handleEnroll;
    act(() => { oldHandle(); app.auth.current.setSession(loginResult()); });
    await act(async () => {});
    expect(app.http).not.toHaveBeenCalled();
    act(() => oldHandle());
    await act(async () => {});
    expect(app.http).not.toHaveBeenCalled();
    expect(app.router.state.location.pathname).toBe(publicPath);
  });

  it("discards a pending old-course response when the same component changes course", async () => {
    const response = deferred(), started = deferred();
    const app = setup({ enroll: (config) => { started.resolve(); return response.promise.then(() => ok(config)); } });
    await enroll(app.user);
    await started.promise;
    const otherPath = "/learn-german/courses/other-course";
    await act(async () => { await app.router.navigate(otherPath); });
    await act(async () => response.resolve());
    expect(app.router.state.location.pathname).toBe(otherPath);
    expectCourseState(app.cache);
    expect(requests(app.http)).toEqual([["post", enrollUrl]]);
  });
});
