import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { router as productionRouter } from "@/app/router/routes";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { account } from "./test/account-fixtures";
import { otherSession, sessionRows } from "./test/session-rows";

async function setup(failure) {
  seedSession();
  const http = vi.fn((config) => {
    if (config.url === "/auth/me") return ok(config, account);
    if (config.url === "/users/me/sessions" && config.method === "get") return ok(config, sessionRows);
    if (failure) throw new AxiosError("INTERNAL diagnostic: Current password is incorrect.", "ERR_BAD_REQUEST", config, null, {
      config, status: failure.status, headers: {}, data: { code: failure.code, message: "INTERNAL diagnostic: Current password is incorrect." },
    });
    throw new Error(`Unexpected mutation: ${config.method} ${config.url}`);
  });
  setHttpHandler(http);
  const view = mountSession(productionRouter.routes, { path: "/account" });
  await screen.findByRole("heading", { name: "Tài khoản của tôi" });
  await within(screen.getByRole("region", { name: "Phiên đăng nhập" })).findByRole("list");
  return { ...view, http, user: userEvent.setup() };
}

describe("Vietnamese Account presentation with the production router", () => {
  it("uses Vietnamese language, accessible names and keyboard controls without incidental mutations", async () => {
    const { user, http, router } = await setup();
    expect(screen.getByRole("heading", { name: "Tài khoản của tôi" }).closest("main")).toHaveAttribute("lang", "vi");
    expect(screen.getByRole("button", { name: "Đăng xuất", exact: true })).toHaveAttribute("lang", "vi");
    const edit = screen.getByRole("button", { name: "Chỉnh sửa hồ sơ" });
    edit.focus();
    await user.keyboard("{Enter}");
    const profile = screen.getByRole("form", { name: "Chỉnh sửa hồ sơ" });
    expect(profile).toHaveAttribute("lang", "vi");
    const fields = [["Tên", "firstName", "50", "given-name"], ["Họ", "lastName", "50", "family-name"], ["Số điện thoại", "phoneNumber", "20", "tel"]];
    within(profile).getByLabelText("Tên", { exact: true }).focus();
    for (const [label, name, max, autocomplete] of fields) {
      const input = within(profile).getByLabelText(label, { exact: true });
      expect(input).toHaveFocus();
      expect(input).toHaveAttribute("name", name);
      expect(input).toHaveAttribute("maxlength", max);
      expect(input).toHaveAttribute("autocomplete", autocomplete);
      expect(input).toHaveAttribute("aria-invalid", "false");
      await user.tab();
    }
    expect(within(profile).getByRole("button", { name: "Lưu" })).toHaveFocus();
    await user.tab();
    expect(within(profile).getByRole("button", { name: "Hủy" })).toHaveFocus();
    await user.keyboard("{Enter}");
    const open = screen.getByRole("button", { name: "Vô hiệu hóa tài khoản", exact: true });
    open.focus();
    await user.keyboard("{Enter}");
    const form = screen.getByRole("form", { name: "Vô hiệu hóa tài khoản" });
    expect(form).toHaveAttribute("lang", "vi");
    const password = within(form).getByLabelText("Mật khẩu hiện tại");
    password.focus();
    await user.keyboard("Password123");
    await user.tab();
    const acknowledgment = within(form).getByRole("checkbox", { name: "Tôi hiểu hậu quả của việc vô hiệu hóa tài khoản của mình." });
    expect(acknowledgment).toHaveFocus();
    await user.keyboard(" ");
    expect(acknowledgment).toBeChecked();
    expect(within(form).getByRole("button", { name: "Xác nhận vô hiệu hóa" })).toBeEnabled();
    await user.click(within(form).getByRole("button", { name: "Hủy vô hiệu hóa" }));
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
    expect(router.state.location.pathname).toBe("/account");
  });

  it.each([
    [400, 3005, "Họ và tên không hợp lệ."],
    [500, 3005, "Không thể lưu hồ sơ. Vui lòng kiểm tra thông tin và thử lại."],
    [400, "3005", "Không thể lưu hồ sơ. Vui lòng kiểm tra thông tin và thử lại."],
  ])("localizes Profile only for its confirmed numeric status/code pair (%s/%s)", async (status, code, expected) => {
    const { user, http, client } = await setup({ status, code });
    await user.click(screen.getByRole("button", { name: "Chỉnh sửa hồ sơ" }));
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
    expect(screen.queryByText(/INTERNAL diagnostic/)).not.toBeInTheDocument();
    expect(client.getQueryData(["account"])).toEqual(account);
    expect(http.mock.calls.filter(([c]) => c.method === "patch")).toHaveLength(1);
  });

  it.each([
    [400, 4021, "Mật khẩu xác nhận phải khớp với mật khẩu mới."],
    [500, 4019, "Không thể đổi mật khẩu. Vui lòng kiểm tra thông tin và thử lại."],
    [400, "4019", "Không thể đổi mật khẩu. Vui lòng kiểm tra thông tin và thử lại."],
    [400, 9999, "Không thể đổi mật khẩu. Vui lòng kiểm tra thông tin và thử lại."],
  ])("does not infer password failure semantics from diagnostic wording (%s/%s)", async (status, code, expected) => {
    const { user, http, auth } = await setup({ status, code });
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    for (const [label, value] of [["Mật khẩu hiện tại", "Password123"], ["Mật khẩu mới", "NewPassword456"], ["Xác nhận mật khẩu mới", "NewPassword456"]]) {
      await user.type(screen.getByLabelText(label, { exact: true }), value);
    }
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
    expect(screen.queryByText(/INTERNAL diagnostic/)).not.toBeInTheDocument();
    expect(http.mock.calls.filter(([c]) => c.method === "put")).toHaveLength(1);
    expect(auth.current.status).toBe("AUTHENTICATED");
  });

  it("preserves session identity and timestamps with localized labels and token-lifetime warning", async () => {
    await setup();
    const region = screen.getByRole("region", { name: "Phiên đăng nhập" });
    expect(region).toHaveAttribute("lang", "vi");
    expect(region).toHaveTextContent("Việc thu hồi phiên đăng nhập ngăn phiên đó tiếp tục làm mới token. Token truy cập đã cấp có thể vẫn còn hiệu lực cho đến khi hết hạn.");
    const row = screen.getByRole("listitem", { name: `Phiên đăng nhập ${otherSession.id}` });
    expect(within(row).getByText("Tạo lúc")).toBeVisible();
    expect(within(row).getByText("Hết hạn lúc")).toBeVisible();
    expect(within(row).getByText("2026-10-08 10:00:00")).toHaveAttribute("datetime", otherSession.createdAt);
    expect(within(row).getByText("Đang hoạt động", { exact: true })).toBeVisible();
    expect(within(row).queryByText("Phiên hiện tại")).not.toBeInTheDocument();
  });
});
