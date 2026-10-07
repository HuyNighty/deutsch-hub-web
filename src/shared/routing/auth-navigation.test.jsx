import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/features/auth/login/components/LoginForm/LoginForm";
import RegisterForm from "@/features/auth/register/components/RegisterForm";
import { useEnrollAction } from "@/features/learn-german/course-detail/hooks/useEnrollAction";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { mountSession, seedSession, loginResult, refreshResult } from "@/test/session-fixtures";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";
import { api } from "@/shared/api/axios";

const target = "/my-learning?course=42#lesson";
function Course() {
  const { handleEnroll } = useEnrollAction("course-42");
  return <><div>Selected Course</div><button onClick={handleEnroll}>Enroll</button></>;
}
const routes = [
  { element: <GuestRoute />, children: [
    { path: "/login", element: <LoginForm /> },
    { path: "/register", element: <RegisterForm /> },
  ] },
  { element: <ProtectedRoute />, children: [
    { path: "/my-learning", element: <div>My Learning</div> },
    { path: "/account", element: <div>Default Account</div> },
  ] },
  { path: "/learn-german/courses/course-42", element: <Course /> },
  { path: "/", element: <div>Home</div> },
];

async function fillLogin(user) {
  await user.type(screen.getByLabelText("Username or Email"), "learner");
  await user.type(screen.getByLabelText("Password"), "password");
}
async function submitLogin(user) {
  await fillLogin(user);
  await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
}

describe("auth navigation and form boundary", () => {
  it("keeps an explicit Login authoritative over an old pending refresh through the real form and hook", async () => {
    seedSession();
    const response = deferred();
    const refreshStarted = deferred();
    const sessionB = loginResult();
    setHttpHandler((config) => {
      if (config.url === "/auth/login") return ok(config, sessionB);
      if (config.url === "/auth/refresh") {
        refreshStarted.resolve();
        return response.promise.then(() => ok(config, refreshResult()));
      }
      return fail(config);
    });
    // Mount the real form directly to exercise explicit session replacement.
    const { auth, client } = mountSession([
      { path: "/login", element: <LoginForm /> },
      { path: "/account", element: <div>New Account</div> },
    ], { path: "/login" });
    client.setQueryData(["sentinel"], "A");
    const oldRequest = api.get("/private").catch((error) => error);
    await act(async () => { await refreshStarted.promise; });
    await submitLogin(userEvent.setup());
    await screen.findByText("New Account");
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    client.setQueryData(["sentinel"], "B");
    await act(async () => { response.resolve(); await oldRequest; });
    expect(auth.current.user.id).toBe("learner-b");
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["sentinel"])).toBe("B");
  });

  it("discards Login completion after local termination", async () => {
    const response = deferred();
    const started = deferred();
    setHttpHandler((config) => {
      started.resolve();
      return response.promise.then(() => ok(config, loginResult()));
    });
    const { auth, router } = mountSession(routes, { path: "/login" });
    await submitLogin(userEvent.setup());
    await act(async () => { await started.promise; auth.current.logout(); response.resolve(); });
    await screen.findByRole("alert");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("writes pathname, search and hash as returnTo and returns there after real Login", async () => {
    const user = userEvent.setup();
    setHttpHandler((config) => ok(config, loginResult()));
    const { router } = mountSession(routes, { path: target });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: target });
    await submitLogin(user);
    await screen.findByText("My Learning");
    expect(router.state.location.pathname + router.state.location.search + router.state.location.hash).toBe(target);
  });

  it("returns from anonymous enrollment to the selected Course without automatically enrolling", async () => {
    const user = userEvent.setup();
    const http = vi.fn((config) => {
      expect(config.url).toBe("/auth/login");
      return ok(config, loginResult());
    });
    setHttpHandler(http);
    const { router } = mountSession(routes, { path: "/learn-german/courses/course-42" });
    await user.click(screen.getByRole("button", { name: "Enroll" }));
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(router.state.location.state).toEqual({ returnTo: "/learn-german/courses/course-42" });
    await submitLogin(user);
    await screen.findByText("Selected Course");
    expect(router.state.location.pathname).toBe("/learn-german/courses/course-42");
    expect(http).toHaveBeenCalledTimes(1);
  });

  it.each(["https://example.com", "//example.com", "/\\example.com", "javascript:alert(1)", "/\n/external", undefined])(
    "falls back to /account for unsafe or missing returnTo %s", async (returnTo) => {
      const user = userEvent.setup();
      setHttpHandler((config) => ok(config, loginResult()));
      const { router } = mountSession(routes, { path: "/login", state: { returnTo } });
      await submitLogin(user);
      await screen.findByText("Default Account");
      expect(router.state.location.pathname).toBe("/account");
    },
  );

  it("preserves returnTo through Login -> Register -> Login links", async () => {
    const user = userEvent.setup();
    setHttpHandler((config) => ok(config, loginResult()));
    const { router } = mountSession(routes, { path: "/login", state: { returnTo: target } });
    await user.click(screen.getByRole("link", { name: "Create one" }));
    expect(router.state.location.pathname).toBe("/register");
    expect(router.state.location.state.returnTo).toBe(target);
    await user.click(screen.getByRole("link", { name: "Login" }));
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state.returnTo).toBe(target);
    await submitLogin(user);
    await screen.findByText("My Learning");
    expect(router.state.location.search + router.state.location.hash).toBe("?course=42#lesson");
  });

  it("disables Login while pending and fences repeat form submissions before and after rerender", async () => {
    const user = userEvent.setup();
    const response = deferred();
    const started = deferred();
    const http = vi.fn((config) => {
      started.resolve();
      return response.promise.then(() => ok(config, loginResult()));
    });
    setHttpHandler(http);
    mountSession(routes, { path: "/login" });
    await fillLogin(user);
    const button = screen.getByRole("button", { name: /Login to DeutschHub/ });
    const form = button.closest("form");
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    await act(async () => { await started.promise; });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    fireEvent.submit(form);
    expect(http).toHaveBeenCalledTimes(1);
    await act(async () => { response.resolve(); });
    await screen.findByText("Default Account");
    expect(http).toHaveBeenCalledTimes(1);
  });

  it("shows malformed Login failure and leaves the browser anonymous with no saved tokens", async () => {
    const user = userEvent.setup();
    setHttpHandler((config) => ok(config, { ...loginResult(), refreshToken: "" }));
    const { auth, router } = mountSession(routes, { path: "/login" });
    await submitLogin(user);
    await screen.findByRole("alert");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("button", { name: /Login to DeutschHub/ })).toBeEnabled();
  });
});
