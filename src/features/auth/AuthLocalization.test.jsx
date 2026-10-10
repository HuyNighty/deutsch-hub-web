import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { router as productionRouter } from "@/app/router/routes";
import { ApiError } from "@/shared/api/api-error";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { deferred, ok, setHttpHandler } from "@/test/http";
import { loginResult, mountSession } from "@/test/session-fixtures";
import * as registerHook from "./register/hooks/useRegister";

const loginFailure = "Không thể đăng nhập. Vui lòng kiểm tra tên đăng nhập/email và mật khẩu.";
const registrationFailure = "Không thể đăng ký. Vui lòng kiểm tra thông tin và thử lại.";
const deactivated = "Tài khoản của bạn đã bị vô hiệu hóa. Bạn chỉ có thể đăng nhập sau khi tài khoản được kích hoạt lại.";
const registrationFields = [
  ["username", "Tên đăng nhập", "Chọn tên đăng nhập", "username", "learner"],
  ["email", "Email", "Nhập email", "email", "learner@example.com"],
  ["password", "Mật khẩu", "Tạo mật khẩu", "new-password", "Password123"],
  ["firstName", "Tên", "Nhập tên", "given-name", "An"],
  ["lastName", "Họ", "Nhập họ", "family-name", "Nguyễn"],
  ["phoneNumber", "Số điện thoại", "Nhập số điện thoại", "tel", "0123456789"],
];

function mount(path, options) {
  return mountSession(productionRouter.routes, { path, ...options });
}

function loginPage() {
  return within(screen.getByRole("heading", { name: "Chào mừng bạn trở lại" }).closest('[lang="vi"]'));
}

function reject(config, status, code, message, errors = []) {
  throw new AxiosError("HTTP failure", AxiosError.ERR_BAD_REQUEST, config, null, {
    config, status, headers: {}, data: { code, message, errors },
  });
}

function noRequests() {
  const http = vi.fn((config) => { throw new Error("Unexpected Auth request: " + config.url); });
  setHttpHandler(http);
  return http;
}

afterEach(() => vi.restoreAllMocks());

describe("Vietnamese Login presentation through the production router", () => {
  it("renders localized labels, placeholders and unchanged links without requesting or establishing a session", () => {
    const http = noRequests();
    const { auth } = mount("/login");
    expect(screen.getByRole("heading", { name: "Chào mừng bạn trở lại" }).closest('[lang="vi"]')).not.toBeNull();
    expect(screen.getByText("Đăng nhập để tiếp tục hành trình của bạn cùng DeutschHub.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên đăng nhập hoặc email")).toHaveAttribute("placeholder", "Nhập tên đăng nhập hoặc email");
    expect(screen.getByLabelText("Tên đăng nhập hoặc email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("placeholder", "Nhập mật khẩu");
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Trang chủ", exact: true })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Quên mật khẩu?" })).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: "Đăng ký", exact: true })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("checkbox", { name: "Ghi nhớ đăng nhập" })).not.toBeChecked();
    expect(screen.getByText("Học tập. Khám phá. Kết nối.")).toBeInTheDocument();
    expect(loginPage().queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(http).not.toHaveBeenCalled();
  });

  it.each([["", ""], ["   ", "password"], ["learner", ""]])("retains empty-input validation for %j / %j", (username, password) => {
    const http = noRequests();
    mount("/login");
    fireEvent.change(screen.getByLabelText("Tên đăng nhập hoặc email"), { target: { value: username } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: password } });
    fireEvent.submit(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ }).closest("form"));
    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng nhập tên đăng nhập/email và mật khẩu.");
    expect(http).not.toHaveBeenCalled();
  });

  it.each([[401, 4001, loginFailure], [403, 4005, deactivated], [403, 4999, loginFailure], [400, 4005, loginFailure], [500, 9999, loginFailure]])(
    "keeps HTTP %s / code %s distinguishable without interpreting backend text", async (status, code, expected) => {
      const backendMessage = "Your account has been deactivated. INTERNAL diagnostic details";
      const http = vi.fn((config) => reject(config, status, code, backendMessage));
      setHttpHandler(http);
      const { router, auth } = mount("/login");
      fireEvent.change(screen.getByLabelText("Tên đăng nhập hoặc email"), { target: { value: " learner " } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password" } });
      fireEvent.submit(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ }).closest("form"));
      expect(await screen.findByRole("alert")).toHaveTextContent(expected);
      expect(screen.queryByText(backendMessage)).not.toBeInTheDocument();
      expect(http).toHaveBeenCalledTimes(1);
      const config = http.mock.calls[0][0];
      expect(config).toMatchObject({ method: "post", url: "/auth/login", requiresAuth: false });
      expect(JSON.parse(config.data)).toEqual({ usernameOrEmail: "learner", password: "password" });
      expect(router.state.location.pathname).toBe("/login");
      expect(auth.current.status).toBe("ANONYMOUS");
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    },
  );

  it.each([
    ["passwordChanged", "Đã đổi mật khẩu thành công. Vui lòng đăng nhập lại."],
    ["sessionEnded", "Phiên đăng nhập của bạn đã kết thúc. Vui lòng đăng nhập lại."],
    ["allSessionsRevoked", "Tất cả phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại."],
    ["accountDeactivated", deactivated],
  ])("preserves the distinct %s status meaning", (flag, message) => {
    const http = noRequests();
    mount("/login", { state: { [flag]: true, returnTo: "/experiences" } });
    expect(loginPage().getAllByRole("status")).toHaveLength(1);
    expect(loginPage().getByRole("status")).toHaveTextContent(message);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(http).not.toHaveBeenCalled();
  });

  it("does not claim successful account operations from non-true status flags", () => {
    const http = noRequests();
    mount("/login", { state: { passwordChanged: "true", sessionEnded: false, allSessionsRevoked: 1, accountDeactivated: null } });
    expect(loginPage().queryByRole("status")).not.toBeInTheDocument();
    expect(http).not.toHaveBeenCalled();
  });

  it("supports keyboard password visibility and login with the original returnTo", async () => {
    const user = userEvent.setup();
    const session = loginResult();
    const http = vi.fn((config) => ok(config, session));
    setHttpHandler(http);
    const { router, auth } = mount("/login", { state: { returnTo: "/experiences?source=auth#intro" } });
    await user.tab();
    expect(screen.getByRole("link", { name: /^DeutschHub/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Trang chủ", exact: true })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Tên đăng nhập hoặc email")).toHaveFocus();
    await user.keyboard("learner");
    await user.tab();
    expect(screen.getByLabelText("Mật khẩu")).toHaveFocus();
    await user.keyboard("password");
    await user.tab();
    expect(screen.getByRole("button", { name: "Hiện mật khẩu" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("type", "text");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Mật khẩu")).toHaveValue("password");
    expect(http).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Ghi nhớ đăng nhập" })).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("checkbox", { name: "Ghi nhớ đăng nhập" })).toBeChecked();
    await user.tab();
    expect(screen.getByRole("link", { name: "Quên mật khẩu?" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ })).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(router.state.location.pathname).toBe("/experiences"));
    expect(router.state.location.pathname + router.state.location.search + router.state.location.hash).toBe("/experiences?source=auth#intro");
    expect(auth.current.user.id).toBe(session.user.id);
    expect(getAccessToken()).toBe(session.accessToken);
    expect(getRefreshToken()).toBe(session.refreshToken);
    expect(http).toHaveBeenCalledTimes(1);
    expect(JSON.parse(http.mock.calls[0][0].data)).toEqual({ usernameOrEmail: "learner", password: "password" });
  });
});

describe("Vietnamese Registration presentation", () => {
  it("renders Vietnamese copy with original field attributes and terms destinations, without new social functionality", async () => {
    const http = noRequests();
    const { router, auth } = mount("/register");
    expect(screen.getByRole("heading", { name: "Tạo tài khoản của bạn" }).closest('[lang="vi"]')).not.toBeNull();
    for (const [field, label, placeholder, autocomplete] of registrationFields) {
      const input = screen.getByLabelText(label, { exact: true });
      expect(input).toHaveAttribute("name", field);
      expect(input).toHaveAttribute("id", field);
      expect(input).toHaveAttribute("placeholder", placeholder);
      expect(input).toHaveAttribute("autocomplete", autocomplete);
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(input).not.toHaveAttribute("aria-describedby");
    }
    expect(screen.getByRole("link", { name: "Điều khoản dịch vụ" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Chính sách quyền riêng tư" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("checkbox", { name: /Tôi đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư/ })).toBeRequired();
    expect(screen.getByRole("link", { name: "Đăng nhập", exact: true })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("button", { name: /Đăng ký tài khoản/ }).closest("form")).toHaveAttribute("novalidate");
    await userEvent.setup().click(screen.getByRole("button", { name: /Google/ }));
    await userEvent.setup().click(screen.getByRole("button", { name: /Facebook/ }));
    expect(router.state.location.pathname).toBe("/register");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(http).not.toHaveBeenCalled();
  });

  it("keeps original backend field details and accessibility bindings alongside a safe top-level fallback", () => {
    const http = noRequests();
    const messages = ["Username already exists", "Email is invalid", "Passwort ist zu kurz", "Tên không hợp lệ", "Last name is required", "<script>internal()</script>" ];
    const error = new ApiError({ status: 400, code: 9999, message: "INTERNAL error data",
      errors: registrationFields.map(([field], index) => ({ field, message: messages[index] })) });
    // Inject the real ApiError shape to test presentation without changing the async submit contract.
    vi.spyOn(registerHook, "default").mockReturnValue({ error, handleRegister: vi.fn(), loading: false });
    mount("/register");
    expect(screen.getByRole("alert")).toHaveTextContent(registrationFailure);
    expect(screen.queryByText("INTERNAL error data")).not.toBeInTheDocument();
    registrationFields.forEach(([field, label], index) => {
      const input = screen.getByLabelText(label, { exact: true });
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", field + "-error");
      expect(input).toHaveAccessibleDescription(messages[index]);
      expect(screen.getByText(messages[index])).toHaveAttribute("id", field + "-error");
    });
    expect(document.querySelector("script")).toBeNull();
    expect(http).not.toHaveBeenCalled();
  });

  it("retains real registration success alert, exact payload and returnTo without creating a login session", async () => {
    const user = userEvent.setup();
    const response = deferred();
    const started = deferred();
    const http = vi.fn((config) => { started.resolve(); return response.promise.then(() => ok(config, { id: "new-learner" })); });
    setHttpHandler(http);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { router, auth } = mount("/register", { state: { returnTo: "/experiences?source=registration#intro" } });
    for (const [, label, , , value] of registrationFields) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
    const password = screen.getByLabelText("Mật khẩu");
    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ẩn mật khẩu" }));
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveValue("Password123");
    expect(http).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Đăng ký tài khoản/ }));
    await act(async () => { await started.promise; });
    expect(alert).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/register");
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "post", url: "/auth/register" });
    expect(JSON.parse(http.mock.calls[0][0].data)).toEqual(Object.fromEntries(registrationFields.map(([field, , , , value]) => [field, value])));
    await act(async () => { response.resolve(); });
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    expect(alert).toHaveBeenCalledExactlyOnceWith("Đăng ký thành công!");
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: "/experiences?source=registration#intro" });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(http).toHaveBeenCalledTimes(1);
  });

  it.each([
    new ApiError({ status: 500, code: 9999, message: "Register successfully! INTERNAL diagnostic" }),
    new ApiError({ status: 403, code: 4005, message: "Deactivated account INTERNAL diagnostic" }),
  ])("uses a safe fallback for unmapped registration errors without deriving meaning from messages: %j", (error) => {
    const http = noRequests();
    vi.spyOn(registerHook, "default").mockReturnValue({ error, handleRegister: vi.fn(), loading: false });
    mount("/register");
    expect(screen.getByRole("alert")).toHaveTextContent(registrationFailure);
    expect(screen.queryByText(error.message)).not.toBeInTheDocument();
    expect(screen.queryByText(deactivated)).not.toBeInTheDocument();
    expect(screen.queryByText("Đăng ký thành công!")).not.toBeInTheDocument();
    for (const [, label] of registrationFields) {
      expect(screen.getByLabelText(label, { exact: true })).toHaveAttribute("aria-invalid", "false");
    }
    expect(http).not.toHaveBeenCalled();
  });

  it("retains actual registration hook failure and field details without a success alert, navigation or session", async () => {
    const detail = { field: "email", message: "Email already registered" };
    const http = vi.fn((config) => reject(config, 400, 9999, "Backend diagnostic", [detail]));
    setHttpHandler(http);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    let registration;
    function Probe() { registration = registerHook.default(); return <span>Registration probe</span>; }
    const { router, auth } = mountSession([{ path: "/register", element: <Probe /> }], { path: "/register" });
    await act(async () => {
      await expect(registration.handleRegister({ email: "learner@example.com" })).rejects.toMatchObject({ status: 400, code: 9999, errors: [detail] });
    });
    await waitFor(() => expect(registration.error).toBeInstanceOf(ApiError));
    expect(registration.error.errors).toEqual([detail]);
    expect(alert).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/register");
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(http).toHaveBeenCalledTimes(1);
  });
});
