import { describe, it, expect, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "@/pages/Account";
import ProtectedRoute from "@/shared/routing/ProtectedRoute";
import GuestRoute from "@/shared/routing/GuestRoute";
import { api } from "@/shared/api/axios";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { mountSession, seedSession, loginResult, refreshResult } from "@/test/session-fixtures";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";

const account = { id: "learner-a", username: "learner", firstName: "Learner", lastName: "Name", fullName: "Learner Name", email: "learner@example.com", phoneNumber: null };
const routes = [
  { element: <ProtectedRoute />, children: [{ path: "/account", element: <AccountPage /> }] },
  { element: <GuestRoute />, children: [{ path: "/login", element: <div>Login surface</div> }] },
];

describe("Account logout reachability", () => {
  it.each(["success", "failure"])("logs out locally before a pending server logout ends in %s", async (outcome) => {
    seedSession();
    const logoutResponse = deferred();
    const logoutStarted = deferred();
    const http = vi.fn((config) => {
      if (config.url === "/auth/me") return ok(config, account);
      if (config.url === "/users/me/sessions") return ok(config, []);
      if (config.url === "/auth/logout") {
        expect(JSON.parse(config.data)).toEqual({ refreshToken: "original-learner-a" });
        logoutStarted.resolve();
        return logoutResponse.promise.then(() => outcome === "success" ? ok(config, null) : fail(config, 500));
      }
      throw new Error(`Unexpected request: ${config.url}`);
    });
    setHttpHandler(http);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const user = userEvent.setup();
    const { auth, client } = mountSession(routes, { path: "/account" });
    client.setQueryData(["sentinel"], "private learner data");
    const button = await screen.findByRole("button", { name: "Logout" });
    await user.click(button);
    await act(async () => { await logoutStarted.promise; });
    await screen.findByText("Login surface");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    await act(async () => { logoutResponse.resolve(); });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("fences pending refresh when the reachable Logout control is clicked", async () => {
    seedSession();
    const refreshStarted = deferred();
    const refreshResponse = deferred();
    const serverLogout = deferred();
    let logoutConfig;
    setHttpHandler((config) => {
      if (config.url === "/auth/me") return ok(config, account);
      if (config.url === "/users/me/sessions") return ok(config, []);
      if (config.url === "/auth/refresh") {
        refreshStarted.resolve();
        return refreshResponse.promise.then(() => ok(config, refreshResult()));
      }
      if (config.url === "/auth/logout") { logoutConfig = config; return serverLogout.promise.then(() => ok(config, null)); }
      return fail(config);
    });
    const user = userEvent.setup();
    const { auth, client } = mountSession(routes, { path: "/account" });
    await screen.findByRole("button", { name: "Logout" });
    client.setQueryData(["sentinel"], "old viewer");
    const oldRequest = api.get("/private").catch((error) => error);
    await act(async () => { await refreshStarted.promise; });
    await user.click(screen.getByRole("button", { name: "Logout" }));
    await screen.findByText("Login surface");
    expect(JSON.parse(logoutConfig.data).refreshToken).toBe("original-learner-a");
    await act(async () => { refreshResponse.resolve(); await oldRequest; serverLogout.resolve(); });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
  });

  it("does not let an old server logout failure terminate a newer login", async () => {
    seedSession();
    const serverLogout = deferred();
    const serverFinished = deferred();
    setHttpHandler((config) => {
      if (config.url === "/auth/me") return ok(config, account);
      if (config.url === "/users/me/sessions") return ok(config, []);
      return serverLogout.promise.then(() => {
        serverFinished.resolve();
        return fail(config, 500);
      });
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const user = userEvent.setup();
    const { auth, client } = mountSession(routes, { path: "/account" });
    await user.click(await screen.findByRole("button", { name: "Logout" }));
    const sessionB = loginResult();
    await act(async () => { auth.current.setSession(sessionB); });
    client.setQueryData(["sentinel"], "new learner");
    await act(async () => { serverLogout.resolve(); await serverFinished.promise; });
    expect(auth.current.user.id).toBe("learner-b");
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["sentinel"])).toBe("new learner");
  });
});
