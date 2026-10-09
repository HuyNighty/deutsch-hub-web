import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "@/pages/Account";
import PasswordForm from "./components/PasswordForm";
import LoginForm from "@/features/auth/login/components/LoginForm/LoginForm";
import ProtectedRoute from "@/shared/routing/ProtectedRoute";
import GuestRoute from "@/shared/routing/GuestRoute";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { mountSession, seedSession, loginResult } from "@/test/session-fixtures";
import { deferred, ok, setHttpHandler } from "@/test/http";
import { account } from "./test/account-fixtures";

const routes = [
  { element: <ProtectedRoute />, children: [{ path: "/account", element: <AccountPage /> }] },
  { element: <GuestRoute />, children: [{ path: "/login", element: <LoginForm /> }] },
];
const passwords = { currentPassword: "CurrentPassword123", newPassword: "NewPassword456", verifyNewPassword: "NewPassword456" };
const labels = { currentPassword: "Current password", newPassword: "New password", verifyNewPassword: "Confirm new password" };
const changedMessage = "Password changed successfully. Please sign in again.";
const uncertaintyMessage = "We couldn't confirm whether your password changed. The safest recovery is to use Logout to end this local session, then sign in again.";

function reject(config, { status = 400, code = 400, message = "Validation failed", errors = [] } = {}) {
  throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code, message, errors },
  });
}
async function setup({ put = (config) => ok(config), read = () => account, login, client } = {}) {
  seedSession();
  const http = vi.fn((config) => {
    if (config.url === "/auth/me") return ok(config, read());
    if (config.url === "/users/me/sessions") return ok(config, []);
    if (config.url === "/users/me/password") return put(config);
    if (config.url === "/auth/login" && login) return login(config);
    if (config.url === "/auth/logout") return ok(config);
    throw new Error(`Unexpected request: ${config.url}`);
  });
  setHttpHandler(http);
  const view = mountSession(routes, { path: "/account", client });
  await screen.findByRole("button", { name: "Change Password" });
  view.client.setQueryData(["sentinel"], "private learner data");
  return { ...view, http, user: userEvent.setup() };
}
async function open(user) {
  await user.click(screen.getByRole("button", { name: "Change Password" }));
}
function fill(values = passwords) {
  Object.entries(values).forEach(([name, value]) => {
    fireEvent.change(screen.getByLabelText(labels[name]), { target: { value } });
  });
}
const puts = (http) => http.mock.calls.filter(([config]) => config.method === "put");
const logouts = (http) => http.mock.calls.filter(([config]) => config.url === "/auth/logout");

describe("Learner password rotation", () => {
  it("keeps Security separate from Profile and exposes exactly three password inputs with Logout reachable", async () => {
    const { user } = await setup();
    expect(screen.getByRole("region", { name: "Security" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Edit Profile" }));
    await open(user);
    const passwordForm = screen.getByRole("form", { name: "Change password" });
    expect(passwordForm.querySelectorAll("input")).toHaveLength(3);
    for (const [name, label] of Object.entries(labels)) {
      const input = within(passwordForm).getByLabelText(label);
      expect(input).toHaveAttribute("name", name);
      expect(input).toHaveAttribute("type", "password");
      expect(input).toHaveAttribute("autocomplete", name === "currentPassword" ? "current-password" : "new-password");
      expect(input).toHaveValue("");
    }
    expect(screen.getByRole("form", { name: "Edit profile" }).querySelectorAll('input[type="password"]')).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
  });

  it.each([
    ["blank current password", { currentPassword: "" }, "currentPassword", "must not be blank"],
    ["whitespace current password", { currentPassword: "   " }, "currentPassword", "must not be blank"],
    ["blank new password", { newPassword: " ", verifyNewPassword: " " }, "newPassword", "must not be blank"],
    ["short new password", { newPassword: "Short1", verifyNewPassword: "Short1" }, "newPassword", "between 8 and 100"],
    ["long new password", { newPassword: "a".repeat(101), verifyNewPassword: "a".repeat(101) }, "newPassword", "between 8 and 100"],
    ["blank confirmation", { verifyNewPassword: "" }, "verifyNewPassword", "must not be blank"],
    ["mismatched confirmation", { verifyNewPassword: "Different123" }, "verifyNewPassword", "must match"],
  ])("blocks %s before PUT", async (_, changes, field, message) => {
    const { user, http, auth, router } = await setup();
    await open(user);
    fill({ ...passwords, ...changes });
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(screen.getByLabelText(labels[field])).toHaveAccessibleDescription(expect.stringContaining(message));
    expect(puts(http)).toHaveLength(0);
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(router.state.location.pathname).toBe("/account");
  });

  it("Cancel discards entered passwords without a request, and reopening starts empty", async () => {
    const { user, http, client } = await setup();
    await open(user);
    fill();
    const before = http.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("form", { name: "Change password" })).not.toBeInTheDocument();
    await open(user);
    Object.values(labels).forEach((label) => expect(screen.getByLabelText(label)).toHaveValue(""));
    expect(http).toHaveBeenCalledTimes(before);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
  });

  it("renders Backend Bean Validation errors beside the exact password fields", async () => {
    const errors = Object.keys(labels).map((field) => ({ field, message: `Backend error for ${field}` }));
    const { user, client, auth } = await setup({ put: (config) => reject(config, { errors }) });
    await open(user);
    fill();
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Validation failed");
    for (const { field, message } of errors) {
      expect(screen.getByLabelText(labels[field])).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText(labels[field])).toHaveAccessibleDescription(message);
      expect(screen.getByLabelText(labels[field])).toHaveValue(passwords[field]);
    }
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(client.getQueryData(["account"])).toEqual(account);
  });

  it.each([
    ["incorrect current password", 400, 4019, "Current password is incorrect.", passwords],
    ["same password", 400, 4020, "New password must be different.", passwords],
    ["canonical strength", 400, 3004, "Password strength is invalid.", { ...passwords, newPassword: "lowercaseonly", verifyNewPassword: "lowercaseonly" }],
    ["unauthorized response", 401, 401, "Password request was unauthorized.", passwords],
    ["server failure", 500, 500, "Unable to change password.", passwords],
  ])("keeps %s at form level, preserving auth, tokens, values, cache and /account with no retry/logout", async (_, status, code, message, values) => {
    const client = new QueryClient({ defaultOptions: {
      queries: { retry: false, gcTime: Infinity }, mutations: { retry: 3, retryDelay: 0 },
    } });
    const { user, http, auth, router } = await setup({ client, put: (config) => reject(config, { status, code, message }) });
    const originalAccess = getAccessToken();
    const originalRefresh = getRefreshToken();
    const generation = getSessionGeneration();
    const canonical = client.getQueryData(["account"]);
    const updatedAt = client.getQueryState(["account"]).dataUpdatedAt;
    await open(user);
    fill(values);
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getSessionGeneration()).toBe(generation);
    expect(getAccessToken()).toBe(originalAccess);
    expect(getRefreshToken()).toBe(originalRefresh);
    expect(router.state.location.pathname).toBe("/account");
    expect(client.getQueryData(["account"])).toBe(canonical);
    expect(client.getQueryState(["account"]).dataUpdatedAt).toBe(updatedAt);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(client.getQueryState(["sentinel"]).isInvalidated).toBe(false);
    for (const [field, label] of Object.entries(labels)) {
      expect(screen.getByLabelText(label)).toHaveValue(values[field]);
      expect(screen.getByLabelText(label)).toHaveAttribute("aria-invalid", "false");
    }
    expect(puts(http)).toHaveLength(1);
    expect(JSON.parse(puts(http)[0][0].data)).toEqual(values);
    expect(logouts(http)).toHaveLength(0);
    expect(http.mock.calls.some(([config]) => config.url === "/auth/refresh")).toBe(false);
    expect(client.getMutationCache().find({ mutationKey: ["account", "change-password"], exact: true }).options.retry).toBe(false);
  });

  it.each([AxiosError.ERR_NETWORK, "ECONNABORTED"])("%s without an HTTP response preserves the session until explicit Logout, explains uncertainty and never replays the PUT", async (code) => {
    const response = deferred();
    const started = deferred();
    const client = new QueryClient({ defaultOptions: {
      queries: { retry: false, gcTime: Infinity }, mutations: { retry: 3, retryDelay: 0 },
    } });
    const logs = ["log", "warn", "error", "info", "debug"].map((method) => vi.spyOn(console, method));
    const { user, http, auth, router } = await setup({ client, put: (config) => {
      started.resolve(config);
      return response.promise;
    } });
    await screen.findByText("No login sessions found.");
    const identity = auth.current.user;
    const generation = getSessionGeneration();
    const access = getAccessToken();
    const refresh = getRefreshToken();
    const cached = [ ["account"], ["account", "sessions"], ["sentinel"] ]
      .map((key) => ({ key, state: client.getQueryState(key) }));
    await open(user);
    fill();
    const form = screen.getByRole("form", { name: "Change password" });
    act(() => { fireEvent.submit(form); fireEvent.submit(form); fireEvent.submit(form); });
    let config;
    await act(async () => { config = await started.promise; });
    expect(await screen.findByRole("button", { name: "Changing password…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Logout", exact: true })).toBeEnabled();
    expect(puts(http)).toHaveLength(1);
    // Even a transport diagnostic containing a password must not reach the UI or logs.
    await act(async () => { response.reject(new AxiosError(`Disconnected: ${passwords.currentPassword}`, code, config)); });
    expect(await screen.findByRole("alert")).toHaveTextContent(uncertaintyMessage);
    expect(screen.queryByText(changedMessage)).not.toBeInTheDocument();
    expect(screen.queryByText(/Please try again|Unable to reach the server/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change Password" })).toBeEnabled();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(auth.current.user).toBe(identity);
    expect(getSessionGeneration()).toBe(generation);
    expect(getAccessToken()).toBe(access);
    expect(getRefreshToken()).toBe(refresh);
    for (const { key, state } of cached) {
      expect(client.getQueryState(key)).toBe(state);
      expect(state.isInvalidated).toBe(false);
    }
    expect(router.state.location.pathname).toBe("/account");
    expect(router.state.location.search).toBe("");
    expect(router.state.location.state).toBeNull();
    expect(config.params).toBeUndefined();
    expect(config.url).toBe("/users/me/password");
    expect(puts(http)).toHaveLength(1);
    expect(logouts(http)).toHaveLength(0);
    expect(http.mock.calls.some(([request]) => request.url === "/auth/refresh")).toBe(false);
    const mutation = client.getMutationCache().find({ mutationKey: ["account", "change-password"], exact: true });
    expect(mutation.state.status).toBe("error");
    expect(mutation.state.failureCount).toBe(1);
    expect(mutation.options.retry).toBe(false);
    for (const value of Object.values(passwords)) {
      expect(screen.getByRole("alert")).not.toHaveTextContent(value);
      expect(logs.flatMap((spy) => spy.mock.calls).flat().map(String).join(" ")).not.toContain(value);
    }
    await user.click(screen.getByRole("button", { name: "Logout", exact: true }));
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getSessionGeneration()).toBe(generation + 1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state?.passwordChanged).not.toBe(true);
    expect(screen.queryByText(changedMessage)).not.toBeInTheDocument();
    expect(puts(http)).toHaveLength(1);
    expect(logouts(http)).toHaveLength(1);
  });

  it("confirmed success terminates the same generation, clears tokens/private cache and replaces navigation with explained Login", async () => {
    const { user, http, auth, client, router, observations } = await setup();
    const generation = getSessionGeneration();
    client.setQueryData(["learner-private-progress"], { private: true });
    await open(user);
    fill();
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(await screen.findByText(changedMessage)).toHaveAttribute("role", "status");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getSessionGeneration()).toBe(generation + 1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(observations.filter(({ status }) => status === "ANONYMOUS").every(({ cache }) => cache === undefined)).toBe(true);
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.location.state).toEqual({ passwordChanged: true, returnTo: "/account" });
    expect(JSON.parse(puts(http)[0][0].data)).toEqual(passwords);
    expect(puts(http)).toHaveLength(1);
    expect(logouts(http)).toHaveLength(0);
  });

  it("real re-login after rotation returns to /account through the existing safe returnTo hook", async () => {
    const session = loginResult("learner-a");
    const { user, http, auth, client, router } = await setup({ login: (config) => ok(config, session) });
    await open(user);
    fill();
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    await screen.findByText(changedMessage);
    expect(client.getQueryData(["account"])).toBeUndefined();
    await user.type(screen.getByLabelText("Username or Email"), "learner");
    await user.type(screen.getByLabelText("Password"), passwords.newPassword);
    await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
    await screen.findByRole("button", { name: "Change Password" });
    expect(router.state.location.pathname).toBe("/account");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).toBe(session.accessToken);
    expect(getRefreshToken()).toBe(session.refreshToken);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    expect(http.mock.calls.filter(([config]) => config.url === "/auth/me")).toHaveLength(2);
    expect(logouts(http)).toHaveLength(0);
  });

  it("fences synchronous repeated submits and disables submit/Cancel while keeping Logout reachable", async () => {
    const response = deferred();
    const started = deferred();
    const { user, http } = await setup({ put: (config) => {
      started.resolve();
      return response.promise.then(() => ok(config));
    } });
    await open(user);
    fill();
    const form = screen.getByRole("form", { name: "Change password" });
    act(() => { fireEvent.submit(form); fireEvent.submit(form); fireEvent.submit(form); });
    await act(async () => { await started.promise; });
    const saving = await screen.findByRole("button", { name: "Changing password…" });
    expect(saving).toBeDisabled();
    expect(saving).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
    await user.click(saving);
    fireEvent.submit(form);
    expect(puts(http)).toHaveLength(1);
    await act(async () => { response.resolve(); });
    await screen.findByText(changedMessage);
    expect(puts(http)).toHaveLength(1);
  });

  it.each(["learner-a", "learner-b"].flatMap((id) => [
    [id, "success"], [id, AxiosError.ERR_NETWORK], [id, "ECONNABORTED"],
  ]))("a late generation-A response after Logout/new login cannot alter generation B (%s, %s)", async (id, outcome) => {
    const response = deferred();
    const started = deferred();
    const finished = deferred();
    let canonical = account;
    const { user, http, client, auth, router } = await setup({ read: () => canonical, put: (config) => {
      started.resolve();
      return response.promise.then(() => {
        finished.resolve();
        if (outcome !== "success") throw new AxiosError("Uncertain old request", outcome, config);
        return ok(config);
      });
    } });
    await open(user);
    fill();
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    await act(async () => { await started.promise; });
    await user.click(screen.getByRole("button", { name: "Logout" }));
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    const sessionB = loginResult(id);
    canonical = { ...account, id, username: "new-session" };
    await act(async () => { auth.current.setSession(sessionB); });
    await screen.findByRole("button", { name: "Change Password" });
    client.setQueryData(["sentinel"], "new session private data");
    const generationB = getSessionGeneration();
    await act(async () => { response.resolve(); await finished.promise; });
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(auth.current.user.id).toBe(id);
    expect(getSessionGeneration()).toBe(generationB);
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(client.getQueryData(["sentinel"])).toBe("new session private data");
    expect(router.state.location.pathname).toBe("/account");
    expect(screen.queryByText(changedMessage)).not.toBeInTheDocument();
    await open(user);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(puts(http)).toHaveLength(1);
    expect(logouts(http)).toHaveLength(1);
  });

  it("suppresses an old generation's uncertainty even when the password form stays mounted across a same-user session replacement", async () => {
    const response = deferred();
    const started = deferred();
    seedSession();
    const http = vi.fn((config) => { started.resolve(config); return response.promise; });
    setHttpHandler(http);
    const { auth, client, router } = mountSession([{ path: "/account", element: <PasswordForm /> }], { path: "/account" });
    fill();
    fireEvent.submit(screen.getByRole("form", { name: "Change password" }));
    let config;
    await act(async () => { config = await started.promise; });
    await screen.findByRole("button", { name: "Changing password…" });
    const mutation = client.getMutationCache().find({ mutationKey: ["account", "change-password"], exact: true });
    const form = screen.getByRole("form", { name: "Change password" });
    const sessionB = loginResult("learner-a");
    await act(async () => { auth.current.setSession(sessionB); });
    client.setQueryData(["sentinel"], "new private data");
    const generationB = getSessionGeneration();
    await act(async () => { response.reject(new AxiosError("Old network failure", AxiosError.ERR_NETWORK, config)); });
    await waitFor(() => expect(mutation.state.status).toBe("error"));
    expect(screen.getByRole("form", { name: "Change password" })).toBe(form);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(auth.current.user.id).toBe("learner-a");
    expect(getSessionGeneration()).toBe(generationB);
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["sentinel"])).toBe("new private data");
    expect(router.state.location.pathname).toBe("/account");
    expect(puts(http)).toHaveLength(1);
  });
});
