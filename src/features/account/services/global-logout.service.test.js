import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { logoutAllSessions } from "./account.service";

describe("Global Logout service boundary", () => {
  it("sends an authenticated bodyless POST to the exact endpoint and unwraps HTTP 200 ApiResponse<Void>", async () => {
    seedSession();
    const http = vi.fn((config) => ({ ...ok(config), data: { code: 200, message: "Logout all sessions successfully" } }));
    setHttpHandler(http);
    await expect(logoutAllSessions({ refreshToken: "ignored", sessionId: "ignored" })).resolves.toBeUndefined();
    expect(http).toHaveBeenCalledTimes(1);
    const config = http.mock.calls[0][0];
    expect(config).toMatchObject({ method: "post", url: "/users/me/logout-all", refreshOnUnauthorized: false });
    expect(config.headers.Authorization).toBe(`Bearer ${getAccessToken()}`);
    expect(config.data).toBeUndefined();
    expect(config.params).toBeUndefined();
    expect(config.requiresAuth).not.toBe(false);
    expect(config.validateStatus(200)).toBe(true);
    [201, 202, 204, 400, 401, 403, 500].forEach((status) => expect(config.validateStatus(status)).toBe(false));
  });

  it("HTTP 401 is surfaced without refresh, POST replay or token termination", async () => {
    seedSession();
    const access = getAccessToken();
    const refresh = getRefreshToken();
    const http = vi.fn((config) => {
      throw new AxiosError("Unauthorized", AxiosError.ERR_BAD_REQUEST, config, null, {
        config, status: 401, headers: {}, data: { code: 401, message: "Global logout unauthorized" },
      });
    });
    setHttpHandler(http);
    await expect(logoutAllSessions()).rejects.toMatchObject({ status: 401, code: 401, message: "Global logout unauthorized" });
    expect(http).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe(access);
    expect(getRefreshToken()).toBe(refresh);
  });
});
