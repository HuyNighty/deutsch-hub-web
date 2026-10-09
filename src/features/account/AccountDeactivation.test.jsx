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

const statusMessage = "Your account has been deactivated. You cannot sign in unless it is reactivated.";
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
  await screen.findByRole("button", { name: "Deactivate account", exact: true });
  await within(screen.getByRole("region", { name: "Login sessions" })).findByRole("list");
  view.client.setQueryData(["sentinel"], "private learner data");
  return { ...view, http, user: userEvent.setup() };
}
const patches = (http) => http.mock.calls.filter(([c]) => c.url === "/users/me/deactivate");
const otherMutations = (http) => http.mock.calls.filter(([c]) => c.url !== "/users/me/deactivate" && ["patch", "put", "post", "delete"].includes(c.method));
const form = () => screen.getByRole("form", { name: "Deactivate account" });
function fill(password = "CurrentPassword123", acknowledged = true) {
  fireEvent.change(within(form()).getByLabelText("Current password"), { target: { value: password } });
  const checkbox = within(form()).getByRole("checkbox");
  if (checkbox.checked !== acknowledged) fireEvent.click(checkbox);
}
async function open(user) {
  await user.click(screen.getByRole("button", { name: "Deactivate account", exact: true }));
}
async function submit(user) {
  await open(user); fill();
  await user.click(within(form()).getByRole("button", { name: "Confirm deactivation" }));
}
async function openCompeting(user, kind) {
  if (kind === "profile") {
    await user.click(screen.getByRole("button", { name: "Edit Profile" }));
    return screen.getByRole("form", { name: "Edit profile" });
  }
  if (kind === "password") {
    await user.click(screen.getByRole("button", { name: "Change Password" }));
    const passwordForm = screen.getByRole("form", { name: "Change password" });
    for (const [label, value] of [["Current password", "CurrentPassword123"], ["New password", "NewPassword456"], ["Confirm new password", "NewPassword456"]]) {
      fireEvent.change(within(passwordForm).getByLabelText(label), { target: { value } });
    }
    return passwordForm;
  }
  if (kind === "global") {
    await user.click(screen.getByRole("button", { name: "Sign out everywhere" }));
    return screen.getByRole("form", { name: "Sign out everywhere" });
  }
  await user.click(within(screen.getByRole("listitem", { name: `Session ${otherSession.id}` })).getByRole("button", { name: "Revoke session" }));
  return screen.getByRole("form", { name: "Revoke session" });
}

describe("Learner Account Deactivation", () => {
  it("is distinct and explains inactivity, revocation, retained data and unavailable screen reactivation", async () => {
    const { http } = await setup();
    const section = screen.getByRole("region", { name: "Account Deactivation" });
    expect(section).toHaveTextContent("no longer be able to sign in while it is inactive");
    expect(section).toHaveTextContent("All login sessions will be revoked");
    expect(section).toHaveTextContent("does not delete your account data");
    expect(section).toHaveTextContent("cannot reactivate your account through this screen");
    expect(section).toHaveTextContent("Existing access tokens may remain valid until they expire");
    for (const name of ["Logout", "Change Password", "Sign out everywhere", "Edit Profile"]) expect(screen.getByRole("button", { name, exact: true })).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Revoke session" }).length).toBeGreaterThan(0);
    expect(patches(http)).toHaveLength(0);
  });

  it("Cancel sends no request and reopening retains neither password nor acknowledgment", async () => {
    const { user, http, client } = await setup();
    await open(user); fill();
    expect(within(form()).getByLabelText("Current password")).toHaveAttribute("type", "password");
    expect(within(form()).getByLabelText("Current password")).toHaveAttribute("autocomplete", "current-password");
    await user.click(within(form()).getByRole("button", { name: "Cancel deactivation" }));
    await open(user);
    expect(within(form()).getByLabelText("Current password")).toHaveValue("");
    expect(within(form()).getByRole("checkbox")).not.toBeChecked();
    expect(patches(http)).toHaveLength(0);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
  });

  it.each([["", true], ["   ", true], ["CurrentPassword123", false]])("rejects password %j / acknowledgment %s even on direct form submission", async (password, acknowledgment) => {
    const { user, http } = await setup();
    await open(user); fill(password, acknowledgment);
    expect(within(form()).getByRole("button", { name: "Confirm deactivation" })).toBeDisabled();
    fireEvent.submit(form());
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter your current password and acknowledge");
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
    expect(screen.queryByText("All login sessions were revoked. Please sign in again.")).not.toBeInTheDocument();
    expect(patches(http)).toHaveLength(1);
    expect(otherMutations(http)).toHaveLength(0);
  });

  it.each([[400, 4019], [403, 4005], [404, 4010], [400, 400], [401, 401], [500, 500]])("HTTP %s / code %s preserves identity and caches, displays Backend refusal and allows deliberate correction", async (status, code) => {
    let failed = true;
    const { user, http, auth, client, router } = await setup({ patch: (config) => failed ? reject(config, status, code) : ok(config) });
    const access = getAccessToken(), refresh = getRefreshToken(), generation = getSessionGeneration();
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Backend refused deactivation");
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).toBe(access); expect(getRefreshToken()).toBe(refresh);
    expect(getSessionGeneration()).toBe(generation);
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(client.getQueryData(["account", "sessions"])).toEqual(sessionRows);
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(router.state.location.pathname).toBe("/account");
    expect(patches(http)).toHaveLength(1); expect(otherMutations(http)).toHaveLength(0);
    expect(http.mock.calls.some(([c]) => c.url === "/auth/refresh")).toBe(false);
    expect(within(form()).getByLabelText("Current password")).toHaveValue("");
    expect(client.getMutationCache().find({ mutationKey: deactivationMutationKey, exact: true }).options.retry).toBe(false);
    failed = false; fill();
    await user.click(within(form()).getByRole("button", { name: "Confirm deactivation" }));
    await screen.findByText(statusMessage);
    expect(patches(http)).toHaveLength(2);
  });

  it("maps Backend password validation to the password input", async () => {
    const { user } = await setup({ patch: (config) => reject(config, 400, 400, "Validation failed", [{ field: "password", message: "Password is required" }]) });
    await submit(user);
    await screen.findByText("Password is required");
    expect(within(form()).getByLabelText("Current password")).toHaveAttribute("aria-invalid", "true");
    expect(within(form()).getByLabelText("Current password")).toHaveAccessibleDescription("Password is required");
  });

  it.each([AxiosError.ERR_NETWORK, "ECONNABORTED"])("%s is an unconfirmed outcome with no replay or false success and ordinary Logout recovery", async (code) => {
    const { user, http, auth, client } = await setup({ patch: (config) => { throw new AxiosError("Ambiguous outcome", code, config); } });
    await submit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't confirm whether your account was deactivated");
    expect(screen.queryByText(statusMessage)).not.toBeInTheDocument();
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(client.getQueryData(["sentinel"])).toBe("private learner data");
    expect(patches(http)).toHaveLength(1); expect(otherMutations(http)).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Logout", exact: true }));
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
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
      expect(within(form()).getByLabelText("Current password")).toHaveValue("");
      expect(await within(form()).findByRole("button", { name: "Deactivating…" })).toBeDisabled();
      expect(within(form()).getByRole("button", { name: "Cancel deactivation" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Logout", exact: true })).toBeEnabled();
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
      await waitFor(() => expect(within(form()).getByRole("button", { name: "Confirm deactivation" })).toBeDisabled());
    } finally { await act(async () => { response.resolve(); }); }
    await screen.findByRole("alert");
    await waitFor(() => expect(within(form()).getByRole("button", { name: "Confirm deactivation" })).toBeEnabled());
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
      await waitFor(() => expect(within(other).getByRole("button", { name: kind === "profile" ? "Save" : kind === "password" ? "Change Password" : kind === "global" ? "Confirm" : "Confirm revoke", exact: true })).toBeDisabled());
      expect(screen.getByRole("button", { name: "Logout", exact: true })).toBeEnabled();
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
      await screen.findByRole("button", { name: "Deactivate account", exact: true });
      // The old button can resolve before the cache-clear loading render; wait for B's profile.
      await screen.findByText(canonical.username);
      await within(await screen.findByRole("region", { name: "Login sessions" })).findByRole("list");
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
    expect(screen.queryByRole("form", { name: "Deactivate account" })).not.toBeInTheDocument();
    expect(patches(http)).toHaveLength(1); expect(otherMutations(http)).toHaveLength(0);
    await open(user);
    expect(within(form()).getByLabelText("Current password")).toHaveValue("");
    expect(within(form()).getByRole("checkbox")).not.toBeChecked();
  });

  it("captures submission generation and prevents dispatch after a synchronous identity replacement", async () => {
    let canonical = account;
    const { user, http, auth, client } = await setup({ profile: () => canonical });
    await open(user); fill();
    const sessionB = loginResult();
    canonical = { ...account, id: "learner-b" };
    act(() => { fireEvent.submit(form()); auth.current.setSession(sessionB); });
    await screen.findByRole("button", { name: "Deactivate account", exact: true });
    expect(patches(http)).toHaveLength(0);
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Login after account deactivation", () => {
  it.each([[403, 4005, statusMessage], [401, 4001, "Invalid username/email or password."], [403, 4999, "Invalid username/email or password."], [400, 4005, "Invalid username/email or password."]])("HTTP %s / code %s maps only the authenticated Backend deactivation refusal", async (status, code, message) => {
    const http = vi.fn((config) => reject(config, status, code));
    setHttpHandler(http);
    const { router } = mountSession(routes, { path: "/login" });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(0);
    fireEvent.change(screen.getByLabelText("Username or Email"), { target: { value: "learner" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /Login to DeutschHub/ }).closest("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(http).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe("/login");
    expect(getAccessToken()).toBeNull(); expect(getRefreshToken()).toBeNull();
  });
});
