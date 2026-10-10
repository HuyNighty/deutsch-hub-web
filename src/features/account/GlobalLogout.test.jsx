import { describe, expect, it, vi } from "vitest";
import { AxiosError, CanceledError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "@/pages/Account";
import LoginForm from "@/features/auth/login/components/LoginForm/LoginForm";
import ProtectedRoute from "@/shared/routing/ProtectedRoute";
import GuestRoute from "@/shared/routing/GuestRoute";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { mountSession, seedSession, loginResult } from "@/test/session-fixtures";
import { deferred, ok, setHttpHandler } from "@/test/http";
import { account } from "./test/account-fixtures";
import { currentSession, otherSession, sessionRows } from "./test/session-rows";

const statusMessage = "Tất cả phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.";
const ambiguityMessage = "Không thể xác nhận tất cả phiên đăng nhập đã được thu hồi hay chưa. Hãy đăng xuất khỏi phiên hiện tại rồi đăng nhập lại.";
const routes = [
  { element: <ProtectedRoute />, children: [{ path: "/account", element: <AccountPage /> }] },
  { element: <GuestRoute />, children: [{ path: "/login", element: <LoginForm /> }] },
];
function reject(config, { status = 500, code = 500, message = "Unable to revoke all sessions" } = {}) {
  throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code, message },
  });
}
async function setup({ post = (config) => ({ ...ok(config), data: { code: 200 } }),
  profile = () => account, sessions = () => sessionRows, password = (config) => ok(config),
  remove = (config) => ok(config), login, client } = {}) {
  seedSession();
  const http = vi.fn((config) => {
    if (config.url === "/auth/me") return ok(config, profile());
    if (config.url === "/users/me/sessions") return Promise.resolve().then(() => {
      if (config.signal?.aborted) throw new CanceledError("Query canceled", config);
      return ok(config, sessions());
    });
    if (config.url === "/users/me/logout-all") return post(config);
    if (config.url === "/users/me/password") return password(config);
    if (config.method === "delete") return remove(config);
    if (config.url === "/auth/logout") return ok(config);
    if (config.url === "/auth/login" && login) return login(config);
    throw new Error(`Unexpected request: ${config.url}`);
  });
  setHttpHandler(http);
  const view = mountSession(routes, { path: "/account", client });
  await screen.findByRole("button", { name: "Đăng xuất trên tất cả thiết bị" });
  await within(screen.getByRole("region", { name: "Phiên đăng nhập" })).findByRole("list");
  view.client.setQueryData(["sentinel"], "private learner data");
  return { ...view, http, user: userEvent.setup() };
}
const posts = (http) => http.mock.calls.filter(([config]) => config.url === "/users/me/logout-all");
const ordinaryLogouts = (http) => http.mock.calls.filter(([config]) => config.url === "/auth/logout");
function assertNoOtherSecurityRequests(http) {
  expect(ordinaryLogouts(http)).toHaveLength(0);
  expect(http.mock.calls.filter(([config]) => config.method === "delete")).toHaveLength(0);
  expect(http.mock.calls.some(([config]) => config.url.includes("deactivate"))).toBe(false);
}
async function open(user) {
  await user.click(screen.getByRole("button", { name: "Đăng xuất trên tất cả thiết bị" }));
}
async function confirm(user) {
  await open(user);
  await user.click(screen.getByRole("button", { name: "Xác nhận", exact: true }));
}
async function openPassword(user) {
  await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
  for (const [label, value] of [["Mật khẩu hiện tại", "CurrentPassword123"], ["Mật khẩu mới", "NewPassword456"], ["Xác nhận mật khẩu mới", "NewPassword456"]]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}
async function openRevoke(user) {
  await user.click(within(screen.getByRole("listitem", { name: `Phiên đăng nhập ${otherSession.id}` })).getByRole("button", { name: "Thu hồi phiên đăng nhập" }));
}

describe("Learner Sign out everywhere", () => {
  it("places a distinct action and honest explanation in Security while preserving ordinary Logout and session revoke", async () => {
    const { http } = await setup();
    const security = screen.getByRole("region", { name: "Bảo mật" });
    expect(within(security).getByRole("button", { name: "Đăng xuất trên tất cả thiết bị" })).toBeEnabled();
    expect(security).toHaveTextContent("Thu hồi tất cả phiên đăng nhập, bao gồm phiên hiện tại. Bạn sẽ cần đăng nhập lại.");
    expect(security).toHaveTextContent("Token truy cập đã cấp có thể vẫn còn hiệu lực cho đến khi hết hạn.");
    expect(screen.getByRole("button", { name: "Đăng xuất", exact: true })).toBeEnabled();
    expect(within(screen.getByRole("listitem", { name: `Phiên đăng nhập ${currentSession.id}` })).getByRole("button", { name: "Thu hồi phiên đăng nhập" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Chỉnh sửa hồ sơ" })).toBeEnabled();
    expect(within(security).getByRole("button", { name: "Đổi mật khẩu" })).toBeEnabled();
    expect(posts(http)).toHaveLength(0);
  });

  it("requires explicit confirmation and Cancel sends no request or cache change", async () => {
    const { user, http, client } = await setup();
    const cached = client.getQueryData(["account", "sessions"]);
    const before = http.mock.calls.length;
    await open(user);
    const form = screen.getByRole("form", { name: "Đăng xuất trên tất cả thiết bị" });
    expect(form).toHaveTextContent("Xác nhận đăng xuất trên tất cả thiết bị?");
    expect(posts(http)).toHaveLength(0);
    await user.click(within(form).getByRole("button", { name: "Hủy" }));
    expect(screen.queryByRole("form", { name: "Đăng xuất trên tất cả thiết bị" })).not.toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(before);
    expect(client.getQueryData(["account", "sessions"])).toBe(cached);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(screen.getByRole("button", { name: "Đăng xuất trên tất cả thiết bị" })).toBeEnabled();
  });

  it("HTTP 200 terminates the initiating generation, clears every private cache/token, and replaces navigation with explained Login", async () => {
    const { user, http, auth, client, router, observations } = await setup();
    client.setQueryData(["assessment-private"], { private: true });
    const generation = getSessionGeneration();
    await confirm(user);
    expect(await screen.findByText(statusMessage)).toHaveAttribute("role", "status");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getSessionGeneration()).toBe(generation + 1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(observations.filter(({ status }) => status === "ANONYMOUS").every(({ cache }) => cache === undefined)).toBe(true);
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.location.state).toEqual({ allSessionsRevoked: true, returnTo: "/account" });
    expect(posts(http)).toHaveLength(1);
    expect(posts(http)[0][0]).toMatchObject({ method: "post", url: "/users/me/logout-all", refreshOnUnauthorized: false });
    expect(posts(http)[0][0].data).toBeUndefined();
    expect(posts(http)[0][0].params).toBeUndefined();
    assertNoOtherSecurityRequests(http);
  });

  it("real re-login after Global Logout returns safely to /account and reads fresh Account/Sessions", async () => {
    const session = loginResult("learner-a");
    const { user, http, auth, client, router } = await setup({ login: (config) => ok(config, session) });
    await confirm(user);
    await screen.findByText(statusMessage);
    fireEvent.change(screen.getByLabelText("Tên đăng nhập hoặc email"), { target: { value: "learner" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Password123" } });
    await user.click(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ }));
    await screen.findByRole("button", { name: "Đăng xuất trên tất cả thiết bị" });
    await within(screen.getByRole("region", { name: "Phiên đăng nhập" })).findByRole("list");
    expect(router.state.location.pathname).toBe("/account");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).toBe(session.accessToken);
    expect(getRefreshToken()).toBe(session.refreshToken);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(client.getQueryData(["account", "sessions"])).toEqual(sessionRows);
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    expect(http.mock.calls.filter(([config]) => config.url === "/auth/me")).toHaveLength(2);
    expect(screen.queryByText(statusMessage)).not.toBeInTheDocument();
    assertNoOtherSecurityRequests(http);
  });

  it.each([[400, "Global logout rejected"], [401, "Global logout unauthorized"], [403, "Global logout forbidden"], [500, "Global logout unavailable"]])(
    "HTTP %s preserves identity, tokens, both Account keys and private cache, without refresh/replay; explicit retry is available",
    async (status, message) => {
      const client = new QueryClient({ defaultOptions: {
        queries: { retry: false, gcTime: Infinity }, mutations: { retry: 3, retryDelay: 0 },
      } });
      let failed = true;
      const { user, http, auth, router } = await setup({ client, post: (config) => failed ? reject(config, { status, code: status, message }) : ok(config) });
      const identity = auth.current.user;
      const generation = getSessionGeneration();
      const access = getAccessToken();
      const refresh = getRefreshToken();
      const canonical = client.getQueryData(["account"]);
      const sessions = client.getQueryData(["account", "sessions"]);
      const updatedAt = client.getQueryState(["account"]).dataUpdatedAt;
      const requestsBefore = http.mock.calls.length;
      await confirm(user);
      expect(await screen.findByRole("alert")).toHaveTextContent("Không thể đăng xuất trên tất cả thiết bị. Vui lòng thử lại.");
      expect(screen.queryByText(message)).not.toBeInTheDocument();
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(auth.current.user).toBe(identity);
      expect(getSessionGeneration()).toBe(generation);
      expect(getAccessToken()).toBe(access);
      expect(getRefreshToken()).toBe(refresh);
      expect(client.getQueryData(["account"])).toBe(canonical);
      expect(client.getQueryState(["account"]).dataUpdatedAt).toBe(updatedAt);
      expect(client.getQueryData(["account", "sessions"])).toBe(sessions);
      expect(client.getQueryState(["account", "sessions"]).isInvalidated).toBe(false);
      expect(client.getQueryData(["sentinel"])).toBe("private learner data");
      expect(router.state.location.pathname).toBe("/account");
      expect(posts(http)).toHaveLength(1);
      expect(http).toHaveBeenCalledTimes(requestsBefore + 1);
      expect(http.mock.calls.some(([config]) => config.url === "/auth/refresh")).toBe(false);
      assertNoOtherSecurityRequests(http);
      expect(client.getMutationCache().find({ mutationKey: ["account", "logout-all"], exact: true }).options.retry).toBe(false);
      expect(screen.getByRole("button", { name: "Xác nhận", exact: true })).toBeEnabled();
      failed = false;
      await user.click(screen.getByRole("button", { name: "Xác nhận", exact: true }));
      await screen.findByText(statusMessage);
      expect(posts(http)).toHaveLength(2);
      assertNoOtherSecurityRequests(http);
    },
  );

  it.each([AxiosError.ERR_NETWORK, "ECONNABORTED"])("%s explains uncertainty without automatic replay, and ordinary Logout provides recovery", async (code) => {
    const { user, http, auth, client, router } = await setup({ post: (config) => {
      throw new AxiosError("Ambiguous transport outcome", code, config);
    } });
    const access = getAccessToken();
    const refresh = getRefreshToken();
    await confirm(user);
    expect(await screen.findByRole("alert")).toHaveTextContent(ambiguityMessage);
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).toBe(access);
    expect(getRefreshToken()).toBe(refresh);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(client.getQueryData(["account", "sessions"])).toEqual(sessionRows);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(router.state.location.pathname).toBe("/account");
    expect(posts(http)).toHaveLength(1);
    assertNoOtherSecurityRequests(http);
    await user.click(screen.getByRole("button", { name: "Đăng xuất", exact: true }));
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(screen.queryByText(statusMessage)).not.toBeInTheDocument();
    expect(posts(http)).toHaveLength(1);
    expect(ordinaryLogouts(http)).toHaveLength(1);
  });

  it("fences synchronous duplicate Global Logout confirms and competing password/revoke forms while pending", async () => {
    const response = deferred();
    const started = deferred();
    const { user, http } = await setup({ post: (config) => {
      started.resolve();
      return response.promise.then(() => reject(config));
    } });
    await openPassword(user);
    await openRevoke(user);
    await open(user);
    const form = screen.getByRole("form", { name: "Đăng xuất trên tất cả thiết bị" });
    const passwordForm = screen.getByRole("form", { name: "Đổi mật khẩu" });
    const revokeForm = screen.getByRole("form", { name: "Thu hồi phiên đăng nhập" });
    act(() => {
      fireEvent.submit(form); fireEvent.submit(form); fireEvent.submit(form);
      fireEvent.submit(passwordForm); fireEvent.submit(revokeForm);
    });
    await act(async () => { await started.promise; });
    const pending = await within(form).findByRole("button", { name: "Đang đăng xuất…" });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute("aria-busy", "true");
    expect(within(form).getByRole("button", { name: "Hủy" })).toBeDisabled();
    expect(within(passwordForm).getByRole("button", { name: "Đổi mật khẩu" })).toBeDisabled();
    expect(within(passwordForm).getByRole("button", { name: "Hủy" })).toBeDisabled();
    expect(within(revokeForm).getByRole("button", { name: "Xác nhận thu hồi" })).toBeDisabled();
    expect(within(revokeForm).getByRole("button", { name: "Hủy thu hồi" })).toBeDisabled();
    expect(within(screen.getByRole("listitem", { name: `Phiên đăng nhập ${currentSession.id}` })).getByRole("button", { name: "Thu hồi phiên đăng nhập" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đăng xuất", exact: true })).toBeEnabled();
    fireEvent.submit(form); fireEvent.submit(passwordForm); fireEvent.submit(revokeForm);
    expect(posts(http)).toHaveLength(1);
    expect(http.mock.calls.filter(([config]) => config.method === "put")).toHaveLength(0);
    assertNoOtherSecurityRequests(http);
    await act(async () => { response.resolve(); });
    await screen.findByRole("alert");
    expect(within(form).getByRole("button", { name: "Xác nhận", exact: true })).toBeEnabled();
    expect(within(passwordForm).getByRole("button", { name: "Đổi mật khẩu" })).toBeEnabled();
    expect(within(revokeForm).getByRole("button", { name: "Xác nhận thu hồi" })).toBeEnabled();
    expect(posts(http)).toHaveLength(1);
  });

  it.each(["password", "revoke"])("blocks Global Logout when a competing %s starts before its pending render", async (kind) => {
    const response = deferred();
    const started = deferred();
    const competing = (config) => { started.resolve(); return response.promise.then(() => reject(config)); };
    const { user, http } = await setup({ password: competing, remove: competing });
    await open(user);
    if (kind === "password") await openPassword(user); else await openRevoke(user);
    const form = screen.getByRole("form", { name: "Đăng xuất trên tất cả thiết bị" });
    const other = screen.getByRole("form", { name: kind === "password" ? "Đổi mật khẩu" : "Thu hồi phiên đăng nhập" });
    act(() => { fireEvent.submit(other); fireEvent.submit(form); });
    await act(async () => { await started.promise; });
    await waitFor(() => expect(within(form).getByRole("button", { name: "Xác nhận", exact: true })).toBeDisabled());
    expect(posts(http)).toHaveLength(0);
    await act(async () => { response.resolve(); });
    await within(screen.getByRole("region", { name: kind === "password" ? "Bảo mật" : "Phiên đăng nhập" })).findByRole("alert");
    await waitFor(() => expect(within(form).getByRole("button", { name: "Xác nhận", exact: true })).toBeEnabled());
    await user.click(within(form).getByRole("button", { name: "Xác nhận", exact: true }));
    await screen.findByText(statusMessage);
    expect(posts(http)).toHaveLength(1);
  });

  it.each(["learner-a", "learner-b"])("late generation-A HTTP 200 after Logout/new session cannot alter B (%s)", async (id) => {
    const response = deferred();
    const started = deferred();
    const finished = deferred();
    let canonical = account;
    let canonicalSessions = sessionRows;
    const { user, http, client, auth, router } = await setup({ profile: () => canonical, sessions: () => canonicalSessions, post: (config) => {
      started.resolve();
      return response.promise.then(() => { finished.resolve(); return ok(config); });
    } });
    await confirm(user);
    await act(async () => { await started.promise; });
    await user.click(screen.getByRole("button", { name: "Đăng xuất", exact: true }));
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    const sessionB = loginResult(id);
    canonical = { ...account, id, username: "new-session" };
    canonicalSessions = [{ ...currentSession, id: "77777777-7777-4777-8777-777777777777" }];
    await act(async () => { auth.current.setSession(sessionB); });
    await screen.findByRole("button", { name: "Đăng xuất trên tất cả thiết bị" });
    await within(screen.getByRole("region", { name: "Phiên đăng nhập" })).findByRole("list");
    client.setQueryData(["sentinel"], "new private data");
    const generationB = getSessionGeneration();
    await act(async () => { response.resolve(); await finished.promise; });
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(auth.current.user.id).toBe(id);
    expect(getSessionGeneration()).toBe(generationB);
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(client.getQueryData(["account", "sessions"])).toEqual(canonicalSessions);
    expect(client.getQueryData(["sentinel"])).toBe("new private data");
    expect(router.state.location.pathname).toBe("/account");
    expect(screen.queryByText(statusMessage)).not.toBeInTheDocument();
    expect(router.state.location.state?.allSessionsRevoked).not.toBe(true);
    expect(posts(http)).toHaveLength(1);
    expect(ordinaryLogouts(http)).toHaveLength(1);
  });

  it("captures generation at confirmation and prevents dispatch if the identity changes before mutationFn runs", async () => {
    let canonical = account;
    const { user, http, auth, client, router } = await setup({ profile: () => canonical });
    await open(user);
    const sessionB = loginResult();
    canonical = { ...account, id: "learner-b", username: "new-session" };
    act(() => {
      fireEvent.submit(screen.getByRole("form", { name: "Đăng xuất trên tất cả thiết bị" }));
      auth.current.setSession(sessionB);
    });
    await screen.findByRole("button", { name: "Đăng xuất trên tất cả thiết bị" });
    await within(screen.getByRole("region", { name: "Phiên đăng nhập" })).findByRole("list");
    expect(posts(http)).toHaveLength(0);
    expect(auth.current.user.id).toBe("learner-b");
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(router.state.location.pathname).toBe("/account");
    expect(screen.queryByText(statusMessage)).not.toBeInTheDocument();
  });
});
