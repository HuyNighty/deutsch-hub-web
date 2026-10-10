import { describe, expect, it, vi } from "vitest";
import { AxiosError, CanceledError } from "axios";
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
import { otherSession, sessionRows } from "./test/session-rows";
import { deactivationMutationKey } from "./hooks/account-mutations";

const statusMessage = "Tài khoản của bạn đã bị vô hiệu hóa. Bạn chỉ có thể đăng nhập sau khi tài khoản được kích hoạt lại.";
const routes = [
  { element: <ProtectedRoute />, children: [{ path: "/account", element: <AccountPage /> }] },
  { element: <GuestRoute />, children: [{ path: "/login", element: <LoginForm /> }] },
];
function reject(config, status = 500, code = 500, message = "Backend refused deactivation", errors = []) {
  throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code, message, errors },
  });
}
async function setup({ patch = (config) => ({ ...ok(config), data: { code: 200 } }), competing = (config) => ok(config),
  profile = () => account } = {}) {
  seedSession();
  const http = vi.fn((config) => {
    if (config.url === "/auth/me") return ok(config, profile());
    if (config.url === "/users/me/sessions") return Promise.resolve().then(() => {
      if (config.signal?.aborted) throw new CanceledError("Query canceled", config);
      return ok(config, sessionRows);
    });
    if (config.url === "/users/me/deactivate") return patch(config);
    if (config.url === "/auth/logout") return ok(config);
    if (["/users/me/profile", "/users/me/password", "/users/me/logout-all"].includes(config.url) || config.method === "delete") return competing(config);
    throw new Error(`Unexpected request: ${config.url}`);
  });
  setHttpHandler(http);
  const view = mountSession(routes, { path: "/account" });
  await screen.findByRole("button", { name: "Vô hiệu hóa tài khoản", exact: true });
  await within(screen.getByRole("region", { name: "Phiên đăng nhập" })).findByRole("list");
  view.client.setQueryData(["sentinel"], "private learner data");
  return { ...view, http, user: userEvent.setup() };
}
const patches = (http) => http.mock.calls.filter(([c]) => c.url === "/users/me/deactivate");
const otherMutations = (http) => http.mock.calls.filter(([c]) => c.url !== "/users/me/deactivate" && ["patch", "put", "post", "delete"].includes(c.method));
const form = () => screen.getByRole("form", { name: "Vô hiệu hóa tài khoản" });
function fill(password = "CurrentPassword123", acknowledged = true) {
  fireEvent.change(within(form()).getByLabelText("Mật khẩu hiện tại"), { target: { value: password } });
  const checkbox = within(form()).getByRole("checkbox");
  if (checkbox.checked !== acknowledged) fireEvent.click(checkbox);
}
async function open(user) {
  await user.click(screen.getByRole("button", { name: "Vô hiệu hóa tài khoản", exact: true }));
}
async function submit(user) {
  await open(user); fill();
  await user.click(within(form()).getByRole("button", { name: "Xác nhận vô hiệu hóa" }));
}
async function openCompeting(user, kind) {
  if (kind === "profile") {
    await user.click(screen.getByRole("button", { name: "Chỉnh sửa hồ sơ" }));
    return screen.getByRole("form", { name: "Chỉnh sửa hồ sơ" });
  }
  if (kind === "password") {
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    const passwordForm = screen.getByRole("form", { name: "Đổi mật khẩu" });
    for (const [label, value] of [["Mật khẩu hiện tại", "CurrentPassword123"], ["Mật khẩu mới", "NewPassword456"], ["Xác nhận mật khẩu mới", "NewPassword456"]]) {
      fireEvent.change(within(passwordForm).getByLabelText(label), { target: { value } });
    }
    return passwordForm;
  }
  if (kind === "global") {
    await user.click(screen.getByRole("button", { name: "Đăng xuất trên tất cả thiết bị" }));
    return screen.getByRole("form", { name: "Đăng xuất trên tất cả thiết bị" });
  }
  await user.click(within(screen.getByRole("listitem", { name: `Phiên đăng nhập ${otherSession.id}` })).getByRole("button", { name: "Thu hồi phiên đăng nhập" }));
  return screen.getByRole("form", { name: "Thu hồi phiên đăng nhập" });
}

describe("Learner Account Deactivation", () => {
  it("is distinct and explains inactivity, revocation, retained data and unavailable screen reactivation", async () => {
    const { http } = await setup();
    const section = screen.getByRole("region", { name: "Vô hiệu hóa tài khoản" });
    expect(section).toHaveTextContent("không thể đăng nhập khi tài khoản chưa được kích hoạt lại");
    expect(section).toHaveTextContent("Tất cả phiên đăng nhập sẽ bị thu hồi");
    expect(section).toHaveTextContent("không xóa dữ liệu tài khoản của bạn");
    expect(section).toHaveTextContent("không thể kích hoạt lại tài khoản qua màn hình này");
    expect(section).toHaveTextContent("Token truy cập đã cấp có thể vẫn còn hiệu lực cho đến khi hết hạn");
    for (const name of ["Đăng xuất", "Đổi mật khẩu", "Đăng xuất trên tất cả thiết bị", "Chỉnh sửa hồ sơ"]) expect(screen.getByRole("button", { name, exact: true })).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Thu hồi phiên đăng nhập" }).length).toBeGreaterThan(0);
    expect(patches(http)).toHaveLength(0);
  });

  it("Cancel sends no request and reopening retains neither password nor acknowledgment", async () => {
    const { user, http, client } = await setup();
    await open(user); fill();
    expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveAttribute("type", "password");
    expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveAttribute("autocomplete", "current-password");
    await user.click(within(form()).getByRole("button", { name: "Hủy vô hiệu hóa" }));
    await open(user);
    expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveValue("");
    expect(within(form()).getByRole("checkbox")).not.toBeChecked();
    expect(patches(http)).toHaveLength(0);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
  });

  it.each([["", true], ["   ", true], ["CurrentPassword123", false]])("rejects password %j / acknowledgment %s even on direct form submission", async (password, acknowledgment) => {
    const { user, http } = await setup();
    await open(user); fill(password, acknowledgment);
    expect(within(form()).getByRole("button", { name: "Xác nhận vô hiệu hóa" })).toBeDisabled();
    fireEvent.submit(form());
    expect(await screen.findByRole("alert")).toHaveTextContent("Nhập mật khẩu hiện tại và xác nhận bạn hiểu hậu quả");
    expect(patches(http)).toHaveLength(0);
  });

  it("HTTP 200 clears tokens and every private key, replaces Login with D1 status and no forced account return or second request", async () => {
    const { user, http, auth, client, router } = await setup();
    client.setQueryData(["assessment-private"], { secret: true });
    const generation = getSessionGeneration();
    await submit(user);
    await screen.findByText(statusMessage);
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getSessionGeneration()).toBe(generation + 1);
    expect(getAccessToken()).toBeNull(); expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.location.state).toEqual({ accountDeactivated: true });
    expect(screen.queryByText("Tất cả phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.")).not.toBeInTheDocument();
    expect(patches(http)).toHaveLength(1);
    expect(otherMutations(http)).toHaveLength(0);
  });

  it.each([[400, 4019], [403, 4005], [404, 4010], [400, 400], [401, 401], [500, 500]])("HTTP %s / code %s preserves identity and caches, displays localized refusal and allows deliberate correction", async (status, code) => {
    let failed = true;
    const { user, http, auth, client, router } = await setup({ patch: (config) => failed ? reject(config, status, code) : ok(config) });
    const access = getAccessToken(), refresh = getRefreshToken(), generation = getSessionGeneration();
    await submit(user);
    const expected = status === 400 && code === 4019 ? "Mật khẩu hiện tại không chính xác."
      : status === 403 && code === 4005 ? "Tài khoản của bạn đã bị vô hiệu hóa."
      : status === 404 && code === 4010 ? "Không tìm thấy tài khoản."
      : "Không thể vô hiệu hóa tài khoản. Vui lòng kiểm tra thông tin và thử lại.";
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
    expect(screen.queryByText("Backend refused deactivation")).not.toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).toBe(access); expect(getRefreshToken()).toBe(refresh);
    expect(getSessionGeneration()).toBe(generation);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(client.getQueryData(["account", "sessions"])).toEqual(sessionRows);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(router.state.location.pathname).toBe("/account");
    expect(patches(http)).toHaveLength(1); expect(otherMutations(http)).toHaveLength(0);
    expect(http.mock.calls.some(([c]) => c.url === "/auth/refresh")).toBe(false);
    expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveValue("");
    expect(client.getMutationCache().find({ mutationKey: deactivationMutationKey, exact: true }).options.retry).toBe(false);
    failed = false; fill();
    await user.click(within(form()).getByRole("button", { name: "Xác nhận vô hiệu hóa" }));
    await screen.findByText(statusMessage);
    expect(patches(http)).toHaveLength(2);
  });

  it("maps Backend password validation to the password input", async () => {
    const { user } = await setup({ patch: (config) => reject(config, 400, 400, "Validation failed", [{ field: "password", message: "Password is required" }]) });
    await submit(user);
    await screen.findByText("Password is required");
    expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveAttribute("aria-invalid", "true");
    expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveAccessibleDescription("Password is required");
  });

  it.each([AxiosError.ERR_NETWORK, "ECONNABORTED"])("%s is an unconfirmed outcome with no replay or false success and ordinary Logout recovery", async (code) => {
    const { user, http, auth, client } = await setup({ patch: (config) => { throw new AxiosError("Ambiguous outcome", code, config); } });
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể xác nhận tài khoản của bạn đã được vô hiệu hóa hay chưa. Hãy đăng xuất khỏi phiên hiện tại. Bạn có thể không đăng nhập lại được nếu tài khoản đã bị vô hiệu hóa.");
    expect(screen.queryByText(statusMessage)).not.toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(patches(http)).toHaveLength(1); expect(otherMutations(http)).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Đăng xuất", exact: true }));
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(patches(http)).toHaveLength(1);
    expect(otherMutations(http).map(([c]) => c.url)).toEqual(["/auth/logout"]);
  });

  it("fences synchronous duplicate confirms, clears entered password and retains no password in mutation variables", async () => {
    const response = deferred(), started = deferred();
    const { user, http, client } = await setup({ patch: (config) => { started.resolve(); return response.promise.then(() => reject(config)); } });
    await open(user); fill();
    act(() => { fireEvent.submit(form()); fireEvent.submit(form()); fireEvent.submit(form()); });
    await act(async () => { await started.promise; });
    try {
      expect(patches(http)).toHaveLength(1);
      expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveValue("");
      expect(await within(form()).findByRole("button", { name: "Đang vô hiệu hóa…" })).toBeDisabled();
      expect(within(form()).getByRole("button", { name: "Hủy vô hiệu hóa" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Đăng xuất", exact: true })).toBeEnabled();
      expect(client.getMutationCache().find({ mutationKey: deactivationMutationKey, exact: true }).state.variables).toEqual({ generation: getSessionGeneration() });
    } finally { await act(async () => { response.resolve(); }); }
    await screen.findByRole("alert");
  });

  it.each(["profile", "password", "global", "revoke"])("blocks deactivation when %s submits first before the pending render", async (kind) => {
    const response = deferred(), started = deferred();
    const { user, http } = await setup({ competing: (config) => { started.resolve(); return response.promise.then(() => reject(config)); } });
    await open(user); fill();
    const other = await openCompeting(user, kind);
    act(() => { fireEvent.submit(other); fireEvent.submit(form()); });
    await act(async () => { await started.promise; });
    try {
      expect(patches(http)).toHaveLength(0);
      expect(otherMutations(http)).toHaveLength(1);
      await waitFor(() => expect(within(form()).getByRole("button", { name: "Xác nhận vô hiệu hóa" })).toBeDisabled());
    } finally { await act(async () => { response.resolve(); }); }
    await screen.findByRole("alert");
    await waitFor(() => expect(within(form()).getByRole("button", { name: "Xác nhận vô hiệu hóa" })).toBeEnabled());
  });

  it.each(["profile", "password", "global", "revoke"])("blocks %s when deactivation submits first before the pending render", async (kind) => {
    const response = deferred(), started = deferred();
    const { user, http } = await setup({ patch: (config) => { started.resolve(); return response.promise.then(() => reject(config)); } });
    await open(user); fill();
    const other = await openCompeting(user, kind);
    act(() => { fireEvent.submit(form()); fireEvent.submit(other); });
    await act(async () => { await started.promise; });
    try {
      expect(patches(http)).toHaveLength(1); expect(otherMutations(http)).toHaveLength(0);
      await waitFor(() => expect(within(other).getByRole("button", { name: kind === "profile" ? "Lưu" : kind === "password" ? "Đổi mật khẩu" : kind === "global" ? "Xác nhận" : "Xác nhận thu hồi", exact: true })).toBeDisabled());
      expect(screen.getByRole("button", { name: "Đăng xuất", exact: true })).toBeEnabled();
    } finally { await act(async () => { response.resolve(); }); }
    await screen.findByRole("alert");
  });

  it.each([[200, "learner-a"], [200, "learner-b"], [400, "learner-b"], [null, "learner-b"]])("late generation-A outcome %s cannot change B (%s), including confirmation/error state", async (status, id) => {
    const response = deferred(), started = deferred(), finished = deferred();
    let canonical = account;
    const { user, http, auth, client, router } = await setup({ profile: () => canonical, patch: (config) => {
      started.resolve();
      return response.promise.then(() => {
        finished.resolve();
        if (status === null) throw new AxiosError("Ambiguous stale outcome", AxiosError.ERR_NETWORK, config);
        return status === 200 ? ok(config) : reject(config, status, 4019);
      });
    } });
    await submit(user);
    await act(async () => { await started.promise; });
    const sessionB = loginResult(id);
    canonical = { ...account, id, username: "new-session" };
    let generationB;
    try {
      await act(async () => { auth.current.setSession(sessionB); });
      await screen.findByRole("button", { name: "Vô hiệu hóa tài khoản", exact: true });
      // The old button can resolve before the cache-clear loading render; wait for B's profile.
      await screen.findByText(canonical.username);
      await within(await screen.findByRole("region", { name: "Phiên đăng nhập" })).findByRole("list");
      client.setQueryData(["sentinel"], "B private data");
      generationB = getSessionGeneration();
    } finally { await act(async () => { response.resolve(); await finished.promise; }); }
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getSessionGeneration()).toBe(generationB);
    expect(getAccessToken()).toBe(sessionB.accessToken); expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(client.getQueryData(["sentinel"])).toBe("B private data");
    expect(router.state.location.pathname).toBe("/account");
    expect(screen.queryByText(statusMessage)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Vô hiệu hóa tài khoản" })).not.toBeInTheDocument();
    expect(patches(http)).toHaveLength(1); expect(otherMutations(http)).toHaveLength(0);
    await open(user);
    expect(within(form()).getByLabelText("Mật khẩu hiện tại")).toHaveValue("");
    expect(within(form()).getByRole("checkbox")).not.toBeChecked();
  });

  it("captures submission generation and prevents dispatch after a synchronous identity replacement", async () => {
    let canonical = account;
    const { user, http, auth, client } = await setup({ profile: () => canonical });
    await open(user); fill();
    const sessionB = loginResult();
    canonical = { ...account, id: "learner-b" };
    act(() => { fireEvent.submit(form()); auth.current.setSession(sessionB); });
    await screen.findByRole("button", { name: "Vô hiệu hóa tài khoản", exact: true });
    expect(patches(http)).toHaveLength(0);
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Login after account deactivation", () => {
  it.each([[403, 4005, statusMessage], [401, 4001, "Không thể đăng nhập. Vui lòng kiểm tra tên đăng nhập/email và mật khẩu."], [403, 4999, "Không thể đăng nhập. Vui lòng kiểm tra tên đăng nhập/email và mật khẩu."], [400, 4005, "Không thể đăng nhập. Vui lòng kiểm tra tên đăng nhập/email và mật khẩu."]])("HTTP %s / code %s maps only the authenticated Backend deactivation refusal", async (status, code, message) => {
    const http = vi.fn((config) => reject(config, status, code));
    setHttpHandler(http);
    const { router } = mountSession(routes, { path: "/login" });
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(0);
    fireEvent.change(screen.getByLabelText("Tên đăng nhập hoặc email"), { target: { value: "learner" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ }).closest("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(http).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe("/login");
    expect(getAccessToken()).toBeNull(); expect(getRefreshToken()).toBeNull();
  });
});
