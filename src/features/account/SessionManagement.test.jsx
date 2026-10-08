import { describe, expect, it, vi } from "vitest";
import { AxiosError, CanceledError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "@/pages/Account";
import LoginForm from "@/features/auth/login/components/LoginForm/LoginForm";
import ProtectedRoute from "@/shared/routing/ProtectedRoute";
import GuestRoute from "@/shared/routing/GuestRoute";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { mountSession, seedSession, loginResult, refreshResult } from "@/test/session-fixtures";
import { deferred, ok, setHttpHandler } from "@/test/http";
import { account } from "./test/account-fixtures";
import { currentSession, otherSession, revokedSession, expiredSession, sessionRows } from "./test/session-rows";

const sessionsKey = ["account", "sessions"];
const endedMessage = "Your session has ended. Please sign in again.";
const revokedMessage = "Login session revoked.";
const routes = [
  { element: <ProtectedRoute />, children: [{ path: "/account", element: <AccountPage /> }] },
  { element: <GuestRoute />, children: [{ path: "/login", element: <LoginForm /> }] },
];
function reject(config, { status = 404, code = 4022, message = "Session not found" } = {}) {
  throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code, message },
  });
}
async function setup({ read = (config) => ok(config, sessionRows), remove = (config) => ok(config),
  profile = () => account, login, refresh, client } = {}) {
  seedSession();
  const sessionReads = vi.fn(read);
  const http = vi.fn((config) => {
    if (config.url === "/auth/me") return ok(config, profile());
    // Honor cancellation before dispatch, including StrictMode's first mount.
    if (config.url === "/users/me/sessions") return Promise.resolve().then(() => {
      if (config.signal?.aborted) throw new CanceledError("Query canceled", config);
      return sessionReads(config);
    });
    if (config.method === "delete") return remove(config);
    if (config.url === "/auth/logout") return ok(config);
    if (config.url === "/auth/login" && login) return login(config);
    if (config.url === "/auth/refresh" && refresh) return refresh(config);
    throw new Error(`Unexpected request: ${config.url}`);
  });
  setHttpHandler(http);
  const view = mountSession(routes, { path: "/account", client });
  await screen.findByRole("region", { name: "Login sessions" });
  view.client.setQueryData(["sentinel"], "private learner data");
  return { ...view, http, sessionReads, user: userEvent.setup() };
}
const section = () => screen.getByRole("region", { name: "Login sessions" });
const row = (session) => screen.getByRole("listitem", { name: `Session ${session.id}` });
const deletes = (http) => http.mock.calls.filter(([config]) => config.method === "delete");
const logouts = (http) => http.mock.calls.filter(([config]) => config.url === "/auth/logout");
async function select(user, session = otherSession) {
  await within(section()).findByRole("list");
  await user.click(within(row(session)).getByRole("button", { name: "Revoke session" }));
}
async function confirm(user, session = otherSession) {
  await select(user, session);
  await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
}
const revokeOther = () => sessionRows.map((session) => session.id === otherSession.id ? {
  ...session, active: false, revokedAt: "2026-10-08T11:22:33.123456",
} : session);

describe("Learner login sessions on Account", () => {
  it("preserves Backend row order, local timestamps, flags and history without device metadata", async () => {
    const { client } = await setup();
    const list = await within(section()).findByRole("list");
    expect(within(list).getAllByRole("listitem").map((item) => item.getAttribute("aria-label")))
      .toEqual(sessionRows.map(({ id }) => `Session ${id}`));
    expect(within(row(currentSession)).getByText("Current session")).toBeVisible();
    expect(within(row(currentSession)).getByText("Active", { exact: true })).toBeVisible();
    expect(within(row(currentSession)).getByText("2026-10-07 09:30:00.123456789")).toHaveAttribute("datetime", currentSession.createdAt);
    expect(within(row(otherSession)).getByText("2026-10-15 10:00:00")).toHaveAttribute("datetime", otherSession.expiresAt);
    expect(within(row(revokedSession)).getByText("2026-09-26 12:30:00")).toHaveAttribute("datetime", revokedSession.revokedAt);
    for (const session of [revokedSession, expiredSession]) {
      expect(within(row(session)).getByText("Inactive", { exact: true })).toBeVisible();
      expect(within(row(session)).queryByRole("button")).not.toBeInTheDocument();
    }
    expect(within(section()).getAllByRole("button", { name: "Revoke session" })).toHaveLength(2);
    expect(section()).not.toHaveTextContent(/device|browser|IP address|location|last active|UTC|GMT/i);
    expect(client.getQueryData(sessionsKey)).toEqual(sessionRows);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(screen.getByRole("region", { name: "Security" }).compareDocumentPosition(section()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows current and inactive together without ending auth or exposing a revoke action", async () => {
    const inactiveCurrent = { ...currentSession, active: false, revokedAt: revokedSession.revokedAt };
    const { auth, client, router } = await setup({ read: (config) => ok(config, [inactiveCurrent]) });
    await within(section()).findByRole("list");
    expect(within(row(inactiveCurrent)).getByText("Current session")).toBeVisible();
    expect(within(row(inactiveCurrent)).getByText("Inactive")).toBeVisible();
    expect(within(row(inactiveCurrent)).queryByRole("button")).not.toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).not.toBeNull();
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(router.state.location.pathname).toBe("/account");
  });

  it("accepts a list with no current row without guessing", async () => {
    const { auth } = await setup({ read: (config) => ok(config, [otherSession, expiredSession]) });
    await within(section()).findByRole("list");
    expect(within(section()).queryByText("Current session")).not.toBeInTheDocument();
    expect(within(row(otherSession)).getByText("Active")).toBeVisible();
    expect(auth.current.status).toBe("AUTHENTICATED");
  });

  it("isolates GET loading from Profile, Password and reachable Logout", async () => {
    const response = deferred();
    const { user } = await setup({ read: (config) => response.promise.then(() => ok(config, sessionRows)) });
    expect(within(section()).getByRole("status")).toHaveTextContent("Loading login sessions…");
    expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Edit Profile" }));
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    expect(screen.getByRole("form", { name: "Edit profile" })).toBeVisible();
    expect(screen.getByRole("form", { name: "Change password" })).toBeVisible();
    await act(async () => { response.resolve(); });
    await within(section()).findByRole("list");
  });

  it("isolates a GET error, renders the Backend message, and supports Retry sessions", async () => {
    let failed = true;
    const { user, sessionReads } = await setup({ read: (config) => failed ?
      reject(config, { status: 500, code: 500, message: "Cannot read login sessions" }) : ok(config, []) });
    expect(await within(section()).findByRole("alert")).toHaveTextContent("Cannot read login sessions");
    expect(screen.getByRole("button", { name: "Edit Profile" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Change Password" })).toBeEnabled();
    failed = false;
    await user.click(screen.getByRole("button", { name: "Retry sessions" }));
    await within(section()).findByText("No login sessions found.");
    expect(sessionReads).toHaveBeenCalledTimes(2);
  });

  it("shows an honest empty state with auth and Account cache intact", async () => {
    const { auth, client } = await setup({ read: (config) => ok(config, []) });
    expect(await within(section()).findByText("No login sessions found.")).toBeVisible();
    expect(within(section()).queryByRole("list")).not.toBeInTheDocument();
    expect(within(section()).queryByText("Current session")).not.toBeInTheDocument();
    expect(client.getQueryData(sessionsKey)).toEqual([]);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(auth.current.status).toBe("AUTHENTICATED");
  });

  it("rejects a malformed successful GET rather than inventing missing current flags", async () => {
    const { client, auth } = await setup({ read: (config) => ok(config, [{ ...otherSession, current: undefined }]) });
    expect(await within(section()).findByRole("alert")).toHaveTextContent("invalid login sessions response");
    expect(client.getQueryData(sessionsKey)).toBeUndefined();
    expect(within(section()).queryByRole("list")).not.toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(screen.getByRole("button", { name: "Change Password" })).toBeEnabled();
  });

  it("requires explicit confirmation and Cancel leaves sessions unchanged without DELETE", async () => {
    const { user, http, client } = await setup();
    await select(user, currentSession);
    expect(screen.getByRole("form", { name: "Revoke session" })).toHaveTextContent("You will need to sign in again.");
    expect(deletes(http)).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Cancel revoke" }));
    expect(screen.queryByRole("form", { name: "Revoke session" })).not.toBeInTheDocument();
    expect(client.getQueryData(sessionsKey)).toEqual(sessionRows);
    expect(deletes(http)).toHaveLength(0);
  });

  it("non-current revoke preserves auth/tokens/unrelated cache and reconciles only Sessions with the Backend", async () => {
    let canonical = sessionRows;
    const { user, http, sessionReads, auth, client, router } = await setup({ read: (config) => ok(config, canonical), remove: (config) => {
      canonical = revokeOther();
      return ok(config);
    } });
    await within(section()).findByRole("list");
    const access = getAccessToken();
    const refresh = getRefreshToken();
    const identity = auth.current.user;
    const generation = getSessionGeneration();
    const canonicalAccount = client.getQueryData(["account"]);
    const updatedAt = client.getQueryState(["account"]).dataUpdatedAt;
    await confirm(user);
    expect(await within(section()).findByText(revokedMessage)).toHaveAttribute("role", "status");
    expect(deletes(http)).toHaveLength(1);
    expect(deletes(http)[0][0]).toMatchObject({ method: "delete", url: `/users/me/sessions/${otherSession.id}` });
    expect(deletes(http)[0][0].data).toBeUndefined();
    expect(deletes(http)[0][0].params).toBeUndefined();
    expect(sessionReads).toHaveBeenCalledTimes(2);
    expect(client.getQueryData(sessionsKey)).toEqual(canonical);
    expect(within(row(otherSession)).getByText("Inactive")).toBeVisible();
    expect(within(row(otherSession)).getByText("2026-10-08 11:22:33.123456")).toBeVisible();
    expect(within(row(otherSession)).queryByRole("button")).not.toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(auth.current.user).toBe(identity);
    expect(getSessionGeneration()).toBe(generation);
    expect(getAccessToken()).toBe(access);
    expect(getRefreshToken()).toBe(refresh);
    expect(client.getQueryData(["account"])).toBe(canonicalAccount);
    expect(client.getQueryState(["account"]).dataUpdatedAt).toBe(updatedAt);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(client.getQueryState(["sentinel"]).isInvalidated).toBe(false);
    expect(router.state.location.pathname).toBe("/account");
    expect(logouts(http)).toHaveLength(0);
    expect(http.mock.calls.some(([config]) => config.url.includes("logout-all"))).toBe(false);
    expect(http.mock.calls.filter(([config]) => config.url === "/auth/me")).toHaveLength(1);
    expect(client.getMutationCache().find({ mutationKey: ["account", "sessions", "revoke"], exact: true }).options.retry).toBe(false);
  });

  it("current revoke terminates the same generation and explains Login with safe /account returnTo and no logout request", async () => {
    const { user, http, sessionReads, client, auth, router, observations } = await setup();
    const generation = getSessionGeneration();
    await confirm(user, currentSession);
    expect(await screen.findByText(endedMessage)).toHaveAttribute("role", "status");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getSessionGeneration()).toBe(generation + 1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(observations.filter(({ status }) => status === "ANONYMOUS").every(({ cache }) => cache === undefined)).toBe(true);
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.location.state).toEqual({ sessionEnded: true, returnTo: "/account" });
    expect(deletes(http)).toHaveLength(1);
    expect(deletes(http)[0][0].url).toBe(`/users/me/sessions/${currentSession.id}`);
    expect(logouts(http)).toHaveLength(0);
    expect(sessionReads).toHaveBeenCalledTimes(1);
  });

  it("real re-login after current revocation returns to /account using existing safe navigation", async () => {
    const session = loginResult("learner-a");
    const { user, client, http, sessionReads, router, auth } = await setup({ login: (config) => ok(config, session) });
    await confirm(user, currentSession);
    await screen.findByText(endedMessage);
    fireEvent.change(screen.getByLabelText("Username or Email"), { target: { value: "learner" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123" } });
    await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
    await screen.findByRole("region", { name: "Login sessions" });
    await within(section()).findByRole("list");
    expect(router.state.location.pathname).toBe("/account");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).toBe(session.accessToken);
    expect(getRefreshToken()).toBe(session.refreshToken);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    expect(sessionReads).toHaveBeenCalledTimes(2);
    expect(logouts(http)).toHaveLength(0);
  });

  it.each([[400, 400, "Cannot revoke session"], [404, 4022, "Session not found"], [500, 500, "Revoke unavailable"]])(
    "definite failure %s/%s preserves auth/caches and shows Backend error with retry available",
    async (status, code, message) => {
      const client = new QueryClient({ defaultOptions: {
        queries: { retry: false, gcTime: Infinity }, mutations: { retry: 3, retryDelay: 0 },
      } });
      let fail = true;
      const { user, http, sessionReads, auth, router } = await setup({ client, remove: (config) => fail ? reject(config, { status, code, message }) : ok(config) });
      await within(section()).findByRole("list");
      const cached = client.getQueryData(sessionsKey);
      const canonicalAccount = client.getQueryData(["account"]);
      const identity = auth.current.user;
      const access = getAccessToken();
      const refresh = getRefreshToken();
      const generation = getSessionGeneration();
      await confirm(user);
      expect(await within(section()).findByRole("alert")).toHaveTextContent(message);
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(auth.current.user).toBe(identity);
      expect(getSessionGeneration()).toBe(generation);
      expect(getAccessToken()).toBe(access);
      expect(getRefreshToken()).toBe(refresh);
      expect(client.getQueryData(sessionsKey)).toBe(cached);
      expect(client.getQueryState(sessionsKey).isInvalidated).toBe(false);
      expect(client.getQueryData(["account"])).toBe(canonicalAccount);
      expect(client.getQueryData(["sentinel"])).toBe("private learner data");
      expect(router.state.location.pathname).toBe("/account");
      expect(logouts(http)).toHaveLength(0);
      expect(sessionReads).toHaveBeenCalledTimes(1);
      expect(deletes(http)).toHaveLength(1);
      expect(client.getMutationCache().find({ mutationKey: ["account", "sessions", "revoke"], exact: true }).options.retry).toBe(false);
      expect(screen.getByRole("button", { name: "Confirm revoke" })).toBeEnabled();
      fail = false;
      await user.click(screen.getByRole("button", { name: "Confirm revoke" }));
      await within(section()).findByText(revokedMessage);
      expect(deletes(http)).toHaveLength(2);
    },
  );

  it("fences synchronous repeated confirms and disables competing actions and Cancel while keeping Logout available", async () => {
    const response = deferred();
    const started = deferred();
    let canonical = sessionRows;
    const { user, http } = await setup({ read: (config) => ok(config, canonical), remove: (config) => {
      started.resolve();
      return response.promise.then(() => { canonical = revokeOther(); return ok(config); });
    } });
    await select(user);
    const form = screen.getByRole("form", { name: "Revoke session" });
    act(() => { fireEvent.submit(form); fireEvent.submit(form); fireEvent.submit(form); });
    await act(async () => { await started.promise; });
    const pending = await screen.findByRole("button", { name: "Revoking…" });
    expect(pending).toBeDisabled();
    expect(pending).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel revoke" })).toBeDisabled();
    expect(within(row(currentSession)).getByRole("button", { name: "Revoke session" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
    fireEvent.submit(form);
    await user.click(pending);
    expect(deletes(http)).toHaveLength(1);
    await act(async () => { response.resolve(); });
    await within(section()).findByText(revokedMessage);
    expect(deletes(http)).toHaveLength(1);
  });

  it.each([[true, "learner-a"], [true, "learner-b"], [false, "learner-a"], [false, "learner-b"]])(
    "late generation-A DELETE cannot alter generation B (current=%s, identity=%s)",
    async (current, id) => {
      const response = deferred();
      const started = deferred();
      const finished = deferred();
      let canonical = sessionRows;
      let canonicalAccount = account;
      const { user, http, sessionReads, client, auth, router } = await setup({ profile: () => canonicalAccount,
        read: (config) => ok(config, canonical), remove: (config) => {
          started.resolve();
          return response.promise.then(() => { finished.resolve(); return ok(config); });
        } });
      await confirm(user, current ? currentSession : otherSession);
      await act(async () => { await started.promise; });
      await user.click(screen.getByRole("button", { name: "Logout" }));
      await screen.findByRole("button", { name: /Login to DeutschHub/ });
      const sessionB = loginResult(id);
      canonical = [{ ...otherSession, id: "77777777-7777-4777-8777-777777777777", current: true }];
      canonicalAccount = { ...account, id, username: "new-session" };
      await act(async () => { auth.current.setSession(sessionB); });
      await screen.findByRole("region", { name: "Login sessions" });
      await within(section()).findByRole("list");
      client.setQueryData(["sentinel"], "new session private data");
      const generationB = getSessionGeneration();
      await act(async () => { response.resolve(); await finished.promise; });
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(auth.current.user.id).toBe(id);
      expect(getSessionGeneration()).toBe(generationB);
      expect(getAccessToken()).toBe(sessionB.accessToken);
      expect(getRefreshToken()).toBe(sessionB.refreshToken);
      expect(client.getQueryData(sessionsKey)).toEqual(canonical);
      expect(client.getQueryData(["account"])).toEqual(canonicalAccount);
      expect(client.getQueryData(["sentinel"])).toBe("new session private data");
      expect(router.state.location.pathname).toBe("/account");
      expect(screen.queryByText(endedMessage)).not.toBeInTheDocument();
      expect(screen.queryByText(revokedMessage)).not.toBeInTheDocument();
      expect(sessionReads).toHaveBeenCalledTimes(2);
      expect(deletes(http)).toHaveLength(1);
      expect(logouts(http)).toHaveLength(1);
    },
  );

  it("a delayed pre-revoke GET cannot restore stale status after canonical reconciliation", async () => {
    const stale = deferred();
    const started = deferred();
    const finished = deferred();
    let count = 0;
    let staleSignal;
    const canonical = revokeOther();
    const { user, sessionReads, client } = await setup({ read: (config) => {
      count += 1;
      if (count === 2) {
        staleSignal = config.signal;
        started.resolve();
        return stale.promise.then(() => { finished.resolve(); return ok(config, sessionRows); });
      }
      return ok(config, count === 1 ? sessionRows : canonical);
    } });
    await within(section()).findByRole("list");
    const background = client.refetchQueries({ queryKey: sessionsKey, exact: true });
    await act(async () => { await started.promise; });
    await confirm(user);
    await within(section()).findByText(revokedMessage);
    expect(staleSignal.aborted).toBe(true);
    expect(client.getQueryData(sessionsKey)).toEqual(canonical);
    await act(async () => { stale.resolve(); await finished.promise; await background; });
    expect(client.getQueryData(sessionsKey)).toEqual(canonical);
    expect(within(row(otherSession)).getByText("Inactive")).toBeVisible();
    expect(sessionReads).toHaveBeenCalledTimes(3);
  });

  it("a generation-A reconciliation GET completing after a new login cannot overwrite B or show stale success", async () => {
    const response = deferred();
    const started = deferred();
    const finished = deferred();
    let count = 0;
    const canonicalB = [{ ...currentSession, id: "88888888-8888-4888-8888-888888888888" }];
    const { user, client, auth, router } = await setup({ read: (config) => {
      count += 1;
      if (count === 2) {
        started.resolve();
        return response.promise.then(() => { finished.resolve(); return ok(config, revokeOther()); });
      }
      return ok(config, count === 1 ? sessionRows : canonicalB);
    } });
    await confirm(user);
    await act(async () => { await started.promise; });
    await user.click(screen.getByRole("button", { name: "Logout" }));
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    const sessionB = loginResult();
    await act(async () => { auth.current.setSession(sessionB); });
    await screen.findByRole("region", { name: "Login sessions" });
    await within(section()).findByRole("list");
    client.setQueryData(["sentinel"], "B");
    const generationB = getSessionGeneration();
    await act(async () => { response.resolve(); await finished.promise; });
    expect(auth.current.user.id).toBe("learner-b");
    expect(getSessionGeneration()).toBe(generationB);
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(sessionsKey)).toEqual(canonicalB);
    expect(client.getQueryData(["sentinel"])).toBe("B");
    expect(router.state.location.pathname).toBe("/account");
    expect(screen.queryByText(revokedMessage)).not.toBeInTheDocument();
    expect(screen.queryByText(endedMessage)).not.toBeInTheDocument();
  });

  it("a successful DELETE with failed canonical GET offers read retry without retrying the mutation", async () => {
    let count = 0;
    const { user, http, sessionReads, auth, client } = await setup({ read: (config) => {
      count += 1;
      if (count === 2) return reject(config, { status: 500, code: 500, message: "Refresh sessions unavailable" });
      return ok(config, count === 1 ? sessionRows : revokeOther());
    } });
    await confirm(user);
    await within(section()).findByText(revokedMessage);
    expect(within(section()).getByRole("alert")).toHaveTextContent("Refresh sessions unavailable");
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    await user.click(screen.getByRole("button", { name: "Retry sessions" }));
    await within(section()).findByRole("list");
    expect(within(row(otherSession)).getByText("Inactive")).toBeVisible();
    expect(deletes(http)).toHaveLength(1);
    expect(sessionReads).toHaveBeenCalledTimes(3);
  });

  it.each([false, true])("preserves shared DELETE 401 refresh behavior (terminal=%s)", async (terminal) => {
    let attempts = 0;
    const rotated = refreshResult();
    const { user, http, auth, client } = await setup({ refresh: (config) => ok(config, rotated),
      read: (config) => ok(config, attempts > 1 ? revokeOther() : sessionRows), remove: (config) => {
        attempts += 1;
        if (attempts === 1 || terminal) return reject(config, { status: 401, code: 401, message: "Unauthorized session request" });
        return ok(config);
      } });
    await confirm(user);
    if (terminal) {
      await screen.findByRole("button", { name: /Login to DeutschHub/ });
      expect(auth.current.status).toBe("ANONYMOUS");
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(client.getQueryCache().getAll()).toHaveLength(0);
      expect(screen.queryByText(endedMessage)).not.toBeInTheDocument();
    } else {
      await within(section()).findByText(revokedMessage);
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(getAccessToken()).toBe(rotated.accessToken);
      expect(getRefreshToken()).toBe(rotated.refreshToken);
      expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    }
    expect(deletes(http)).toHaveLength(2);
    expect(http.mock.calls.filter(([config]) => config.url === "/auth/refresh")).toHaveLength(1);
    expect(logouts(http)).toHaveLength(0);
  });

  it.each([false, true])("preserves shared GET 4023/401 refresh behavior (terminal=%s)", async (terminal) => {
    seedSession();
    let attempts = 0;
    const rotated = refreshResult();
    const http = vi.fn((config) => {
      if (config.url === "/auth/me") return ok(config, account);
      if (config.url === "/auth/refresh") return ok(config, rotated);
      if (config.url === "/users/me/sessions") return Promise.resolve().then(() => {
        if (config.signal?.aborted) throw new CanceledError("Query canceled", config);
        attempts += 1;
        if (attempts === 1 || terminal) return reject(config, { status: 401, code: 4023, message: "Invalid session identity" });
        return ok(config, sessionRows);
      });
      throw new Error(`Unexpected request: ${config.url}`);
    });
    setHttpHandler(http);
    const { client, auth, router } = mountSession(routes, { path: "/account" });
    if (terminal) {
      await screen.findByRole("button", { name: /Login to DeutschHub/ });
      expect(auth.current.status).toBe("ANONYMOUS");
      expect(client.getQueryCache().getAll()).toHaveLength(0);
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(router.state.location.state).toEqual({ returnTo: "/account" });
      expect(screen.queryByText(endedMessage)).not.toBeInTheDocument();
    } else {
      await screen.findByRole("region", { name: "Login sessions" });
      await within(section()).findByRole("list");
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(getAccessToken()).toBe(rotated.accessToken);
      expect(getRefreshToken()).toBe(rotated.refreshToken);
      expect(client.getQueryData(sessionsKey)).toEqual(sessionRows);
    }
    expect(attempts).toBe(2);
    expect(http.mock.calls.filter(([config]) => config.url === "/auth/refresh")).toHaveLength(1);
  });
});
