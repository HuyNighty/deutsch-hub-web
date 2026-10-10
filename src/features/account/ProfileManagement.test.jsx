import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "@/pages/Account";
import ProtectedRoute from "@/shared/routing/ProtectedRoute";
import { mountSession, seedSession, loginResult } from "@/test/session-fixtures";
import { deferred, ok, setHttpHandler } from "@/test/http";
import { account } from "./test/account-fixtures";

const routes = [
  { element: <ProtectedRoute />, children: [{ path: "/account", element: <AccountPage /> }] },
  { path: "/login", element: <div>Login surface</div> },
];

function rejectProfile(config, { message, errors = [], code = 9999 }) {
  throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status: 400, headers: {}, data: { code, message, errors },
  });
}

async function setup(update = (config) => ok(config, account)) {
  seedSession();
  const http = vi.fn((config) => {
    if (config.url === "/auth/me") return ok(config, account);
    if (config.url === "/users/me/sessions") return ok(config, []);
    if (config.url === "/users/me/profile") return update(config);
    if (config.url === "/auth/logout") return ok(config, null);
    throw new Error(`Unexpected request: ${config.url}`);
  });
  setHttpHandler(http);
  const view = mountSession(routes, { path: "/account" });
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "Chỉnh sửa hồ sơ" });
  return { ...view, user, http };
}

const patches = (http) => http.mock.calls.filter(([config]) => config.method === "patch");
async function edit(user) {
  await user.click(screen.getByRole("button", { name: "Chỉnh sửa hồ sơ" }));
}
async function change(user, label, value) {
  const input = screen.getByRole("textbox", { name: label });
  await user.clear(input);
  if (value) await user.type(input, value);
}

describe("Learner profile management on Account", () => {
  it("shows canonical values and exposes only three editable fields", async () => {
    const { user, client } = await setup();
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(screen.getByText(account.fullName)).toBeVisible();
    expect(screen.getByText(account.firstName)).toBeVisible();
    expect(screen.getByText(account.lastName)).toBeVisible();
    await edit(user);
    expect(screen.getByText("Tên đăng nhập (chỉ đọc)")).toBeVisible();
    expect(screen.getByText("Email (chỉ đọc)")).toBeVisible();
    expect(screen.getByText(account.username)).toBeVisible();
    expect(screen.getByText(account.email)).toBeVisible();
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(screen.getByRole("textbox", { name: "Tên" })).toHaveValue(account.firstName);
    expect(screen.getByRole("textbox", { name: "Họ" })).toHaveValue(account.lastName);
    expect(screen.getByRole("textbox", { name: "Số điện thoại" })).toHaveValue(account.phoneNumber);
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeEnabled();
  });

  it("Cancel discards changes and reopening uses the current canonical cache without any request", async () => {
    const { user, client, http } = await setup();
    await edit(user);
    await change(user, "Tên", "Unsaved");
    await change(user, "Số điện thoại", "");
    const fresh = { ...account, firstName: "Fresh", fullName: "Fresh Name", phoneNumber: null };
    await act(async () => { client.setQueryData(["account"], fresh); });
    const requestCount = http.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Hủy" }));
    expect(screen.getByText(fresh.fullName)).toBeVisible();
    await edit(user);
    expect(screen.getByRole("textbox", { name: "Tên" })).toHaveValue("Fresh");
    expect(screen.getByRole("textbox", { name: "Họ" })).toHaveValue(account.lastName);
    expect(screen.getByRole("textbox", { name: "Số điện thoại" })).toHaveValue("");
    expect(http).toHaveBeenCalledTimes(requestCount);
    expect(patches(http)).toHaveLength(0);
  });

  it("Save replaces Account with server-canonicalized values, sends empty phone unchanged, and stays on /account", async () => {
    const canonical = { ...account, firstName: "Anna", lastName: "Schmidt", fullName: "Canonical display name", phoneNumber: "" };
    const { user, client, http, router, auth } = await setup((config) => ok(config, canonical));
    client.setQueryData(["sentinel"], "unrelated");
    const authBefore = auth.current.user;
    await edit(user);
    await change(user, "Tên", " Anna ");
    await change(user, "Họ", " Schmidt ");
    await change(user, "Số điện thoại", "");
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    await screen.findByText("Đã lưu hồ sơ.");
    expect(JSON.parse(patches(http)[0][0].data)).toEqual({ firstName: " Anna ", lastName: " Schmidt ", phoneNumber: "" });
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(screen.getByText(canonical.fullName)).toBeVisible();
    expect(screen.getByText("Anna")).toBeVisible();
    expect(screen.getByText("Schmidt")).toBeVisible();
    expect(router.state.location.pathname).toBe("/account");
    expect(http.mock.calls.filter(([config]) => config.url === "/auth/me")).toHaveLength(1);
    expect(client.getQueryData(["sentinel"])).toBe("unrelated");
    expect(client.getQueryState(["sentinel"]).isInvalidated).toBe(false);
    expect(auth.current.user).toBe(authBefore);
    await edit(user);
    expect(screen.getByRole("textbox", { name: "Tên" })).toHaveValue("Anna");
    expect(screen.getByRole("textbox", { name: "Số điện thoại" })).toHaveValue("");
  });

  it("shows Backend validation errors beside matching inputs and preserves the canonical cache", async () => {
    const errors = [
      { field: "firstName", message: "First name is too long" },
      { field: "lastName", message: "Last name is too long" },
      { field: "phoneNumber", message: "Phone number is too long" },
    ];
    const { user, client } = await setup((config) => rejectProfile(config, { message: "Validation failed", errors }));
    await edit(user);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể lưu hồ sơ. Vui lòng kiểm tra thông tin và thử lại.");
    expect(screen.queryByText("Validation failed")).not.toBeInTheDocument();
    for (const [index, label] of ["Tên", "Họ", "Số điện thoại"].entries()) {
      expect(screen.getByRole("textbox", { name: label })).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("textbox", { name: label })).toHaveAccessibleDescription(errors[index].message);
    }
    expect(client.getQueryData(["account"])).toEqual(account);
  });

  it("a background Account read cannot overwrite the successful canonical PATCH response", async () => {
    const patchResponse = deferred();
    const patchStarted = deferred();
    const readResponse = deferred();
    const readStarted = deferred();
    const canonical = { ...account, firstName: "Saved", fullName: "Saved Name" };
    const { user, client } = await setup((config) => {
      patchStarted.resolve();
      return patchResponse.promise.then(() => ok(config, canonical));
    });
    await edit(user);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    await act(async () => { await patchStarted.promise; });
    setHttpHandler((config) => {
      expect(config.url).toBe("/auth/me");
      readStarted.resolve();
      return readResponse.promise.then(() => ok(config, account));
    });
    const backgroundRead = client.refetchQueries({ queryKey: ["account"], exact: true });
    await act(async () => { await readStarted.promise; patchResponse.resolve(); });
    await screen.findByText("Đã lưu hồ sơ.");
    await act(async () => { readResponse.resolve(); await backgroundRead; });
    expect(client.getQueryData(["account"])).toEqual(canonical);
    expect(screen.getByText(canonical.fullName)).toBeVisible();
  });

  it("uses a safe form-level fallback for an unconfirmed string code with edits and canonical cache intact", async () => {
    const { user, client, http } = await setup((config) => rejectProfile(config, { message: "Invalid full name", code: "INVALID_FULL_NAME" }));
    await edit(user);
    await change(user, "Tên", "Retry name");
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể lưu hồ sơ. Vui lòng kiểm tra thông tin và thử lại.");
    expect(screen.getByRole("textbox", { name: "Tên" })).toHaveValue("Retry name");
    screen.getAllByRole("textbox").forEach((input) => expect(input).toHaveAttribute("aria-invalid", "false"));
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(patches(http)).toHaveLength(1);
  });

  it("rejects a malformed successful PATCH without replacing canonical cache", async () => {
    const { user, client } = await setup((config) => ok(config, { ...account, lastName: undefined }));
    await edit(user);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể xác nhận hồ sơ đã được lưu hay chưa. Hãy kiểm tra lại thông tin tài khoản trước khi thử lại.");
    expect(client.getQueryData(["account"])).toEqual(account);
  });

  it("fences synchronous repeated submits and disables Save while the PATCH is pending", async () => {
    const response = deferred();
    const started = deferred();
    const { user, client, http } = await setup((config) => {
      started.resolve();
      return response.promise.then(() => ok(config, account));
    });
    await edit(user);
    const form = screen.getByRole("form", { name: "Chỉnh sửa hồ sơ" });
    act(() => { fireEvent.submit(form); fireEvent.submit(form); fireEvent.submit(form); });
    await act(async () => { await started.promise; });
    const saving = await screen.findByRole("button", { name: "Đang lưu…" });
    expect(saving).toBeDisabled();
    expect(saving).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeEnabled();
    await user.click(saving);
    fireEvent.submit(form);
    expect(patches(http)).toHaveLength(1);
    expect(client.getQueryData(["account"])).toEqual(account);
    await act(async () => { response.resolve(); });
    await screen.findByText("Đã lưu hồ sơ.");
  });

  it.each([
    ["Tên", " ", "không được để trống"],
    ["Họ", "", "không được để trống"],
    ["Tên", "a".repeat(51), "không được vượt quá 50"],
    ["Họ", "b".repeat(51), "không được vượt quá 50"],
    ["Số điện thoại", "c".repeat(21), "không được vượt quá 20"],
  ])("blocks invalid %s before PATCH", async (label, value, message) => {
    const { user, http } = await setup();
    await edit(user);
    const input = screen.getByRole("textbox", { name: label });
    fireEvent.change(input, { target: { value } });
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(input).toHaveAccessibleDescription(expect.stringContaining(message));
    expect(patches(http)).toHaveLength(0);
  });

  it("allows arbitrary phone text within the Backend size limit", async () => {
    const { user, http } = await setup();
    await edit(user);
    await change(user, "Số điện thoại", "extension abc");
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    await screen.findByText("Đã lưu hồ sơ.");
    expect(JSON.parse(patches(http)[0][0].data).phoneNumber).toBe("extension abc");
  });

  it.each([false, true])("a pending save cannot restore old Account after Logout (new login: %s)", async (newLogin) => {
    const response = deferred();
    const finished = deferred();
    const started = deferred();
    const { user, client, auth } = await setup((config) => {
      started.resolve();
      return response.promise.then(() => { finished.resolve(); return ok(config, { ...account, firstName: "Old" }); });
    });
    await edit(user);
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    await act(async () => { await started.promise; });
    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await screen.findByText("Login surface");
    const nextAccount = { ...account, id: "learner-b", username: "new-learner" };
    if (newLogin) {
      await act(async () => { auth.current.setSession(loginResult()); });
      client.setQueryData(["account"], nextAccount);
    }
    await act(async () => { response.resolve(); await finished.promise; });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(client.getQueryData(["account"])).toEqual(newLogin ? nextAccount : undefined);
    expect(auth.current.status).toBe(newLogin ? "AUTHENTICATED" : "ANONYMOUS");
    if (newLogin) expect(auth.current.user.id).toBe("learner-b");
  });
});
