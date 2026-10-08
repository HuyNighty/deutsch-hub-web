import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { deactivateAccount } from "./account.service";

describe("Account Deactivation service boundary", () => {
  it("sends only the unchanged password in an authenticated PATCH and accepts only HTTP 200 Void", async () => {
    seedSession();
    const http = vi.fn((config) => ({ ...ok(config), data: { code: 200, message: "Deactivate account successfully" } }));
    setHttpHandler(http);
    await expect(deactivateAccount({ password: " current password ", userId: "ignored", sid: "ignored", acknowledged: true })).resolves.toBeUndefined();
    expect(http).toHaveBeenCalledTimes(1);
    const config = http.mock.calls[0][0];
    expect(config).toMatchObject({ method: "patch", url: "/users/me/deactivate", refreshOnUnauthorized: false });
    expect(config.baseURL).toMatch(/\/api\/v1$/);
    expect(config.headers.Authorization).toBe(`Bearer ${getAccessToken()}`);
    expect(JSON.parse(config.data)).toEqual({ password: " current password " });
    expect(config.params).toBeUndefined();
    expect(config.requiresAuth).not.toBe(false);
    expect(config.validateStatus(200)).toBe(true);
    [201, 202, 204, 400, 401, 403, 404, 500].forEach((status) => expect(config.validateStatus(status)).toBe(false));
  });

  it("surfaces HTTP 401 without credential refresh, PATCH replay or local termination", async () => {
    seedSession();
    const access = getAccessToken(), refresh = getRefreshToken();
    const http = vi.fn((config) => {
      throw new AxiosError("Unauthorized", AxiosError.ERR_BAD_REQUEST, config, null, {
        config, status: 401, headers: {}, data: { code: 401, message: "Unauthorized" },
      });
    });
    setHttpHandler(http);
    await expect(deactivateAccount({ password: "current" })).rejects.toMatchObject({ status: 401, code: 401 });
    expect(http).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe(access);
    expect(getRefreshToken()).toBe(refresh);
  });
});
