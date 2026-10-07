import { describe, it, expect, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/shared/routing/ProtectedRoute";
import GuestRoute from "@/shared/routing/GuestRoute";
import { getAccessToken, getRefreshToken, saveAccessToken } from "@/shared/auth/token";
import { mountSession, seedSession, refreshResult } from "@/test/session-fixtures";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";

const protectedRoutes = [
  { element: <ProtectedRoute />, children: [{ path: "/private", element: <div>Protected content</div> }] },
  { element: <GuestRoute />, children: [{ path: "/login", element: <div>Login surface</div> }] },
];
const guestRoutes = [
  { element: <GuestRoute />, children: [{ path: "/login", element: <div>Login surface</div> }] },
  { path: "/account", element: <div>Authenticated account</div> },
];

describe("session bootstrap", () => {
  it("restores valid access immediately and renders protected content without refresh", () => {
    seedSession();
    const http = vi.fn();
    setHttpHandler(http);
    const { auth } = mountSession(protectedRoutes, { path: "/private" });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(auth.current.isAuthenticated).toBe(true);
    expect(auth.current.user).toEqual({ id: "learner-a", roles: ["LEARNER"] });
    expect(auth.current.hasRole("LEARNER")).toBe(true);
    expect(auth.current.hasAnyRole(["ADMIN", "LEARNER"])).toBe(true);
    expect(http).not.toHaveBeenCalled();
  });

  it.each([["protected", protectedRoutes, "/private", "Protected content"],
    ["guest", guestRoutes, "/login", "Authenticated account"]])(
    "keeps the %s guard neutral while exactly one StrictMode bootstrap refresh is pending",
    async (_, routes, path, finalContent) => {
      seedSession({ expired: true });
      const response = deferred();
      const started = deferred();
      const http = vi.fn((config) => {
        expect(config.url).toBe("/auth/refresh");
        started.resolve();
        return response.promise.then((result) => ok(config, result));
      });
      setHttpHandler(http);
      const { router, auth } = mountSession(routes, { path });
      await act(async () => { await started.promise; });
      expect(auth.current.status).toBe("CHECKING");
      expect(router.state.location.pathname).toBe(path);
      expect(screen.queryByText("Login surface")).not.toBeInTheDocument();
      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
      const rotated = refreshResult();
      await act(async () => { response.resolve(rotated); });
      await screen.findByText(finalContent);
      expect(auth.current.status).toBe("AUTHENTICATED");
      expect(getAccessToken()).toBe(rotated.accessToken);
      expect(getRefreshToken()).toBe(rotated.refreshToken);
      expect(http).toHaveBeenCalledTimes(1);
    },
  );

  it.each([true, false])("terminates a failed bootstrap (access present: %s) and clears cached data", async (access) => {
    seedSession({ expired: true, access });
    const client = new QueryClient();
    client.setQueryData(["sentinel"], "old learner");
    setHttpHandler((config) => fail(config));
    const { auth } = mountSession(protectedRoutes, { path: "/private", client });
    await screen.findByText("Login surface");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
  });

  it("removes unusable access without a refresh token and resolves anonymous", async () => {
    saveAccessToken("broken");
    const http = vi.fn();
    setHttpHandler(http);
    const { auth } = mountSession(protectedRoutes, { path: "/private" });
    await screen.findByText("Login surface");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(http).not.toHaveBeenCalled();
  });

  it("restores from a refresh token when access is absent", async () => {
    seedSession({ access: false });
    setHttpHandler((config) => ok(config, refreshResult()));
    const { auth } = mountSession(protectedRoutes, { path: "/private" });
    await screen.findByText("Protected content");
    await waitFor(() => expect(auth.current.status).toBe("AUTHENTICATED"));
  });
});
