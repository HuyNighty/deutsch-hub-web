import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { account } from "../test/account-fixtures";
import { parseAccount } from "../account-response";
import { getAccount, updateProfile, changePassword } from "./account.service";

describe("Canonical Account response boundary", () => {
  it.each([null, undefined, [], "account", 12])("rejects a non-object response %j", (value) => {
    expect(() => parseAccount(value)).toThrow(ApiError);
  });

  it.each(["id", "username", "email", "firstName", "lastName", "fullName"].flatMap((field) =>
    [undefined, null, "", "  ", 12].map((value) => [field, value]),
  ))("rejects malformed required %s: %j", (field, value) => {
    expect(() => parseAccount({ ...account, [field]: value })).toThrow(ApiError);
  });

  it.each([undefined, 123, {}, []])("rejects malformed phoneNumber %j", (phoneNumber) => {
    expect(() => parseAccount({ ...account, phoneNumber })).toThrow(ApiError);
  });

  it.each([null, "", "any string"])("accepts phoneNumber %j without transforming canonical fields", (phoneNumber) => {
    const result = { ...account, phoneNumber, fullName: "Server display name", extra: "retained" };
    expect(parseAccount(result)).toBe(result);
  });

  it.each([
    ["GET", () => getAccount(), "get", "/auth/me"],
    ["PATCH", () => updateProfile({ firstName: "Updated", lastName: "Name", phoneNumber: "" }), "patch", "/users/me/profile"],
  ])("%s consumes expanded canonical response and uses the same parser", async (_, request, method, url) => {
    seedSession();
    const http = vi.fn((config) => ok(config, account));
    setHttpHandler(http);
    await expect(request()).resolves.toEqual(account);
    expect(http.mock.calls[0][0]).toMatchObject({ method, url });
    setHttpHandler((config) => ok(config, { ...account, firstName: undefined }));
    await expect(request()).rejects.toBeInstanceOf(ApiError);
  });

  it.each([null, ""])("PATCH sends only supported fields and preserves phone %j", async (phoneNumber) => {
    seedSession();
    const http = vi.fn((config) => ok(config, { ...account, phoneNumber }));
    setHttpHandler(http);
    await updateProfile({ firstName: null, lastName: null, phoneNumber, username: "forbidden", email: "forbidden" });
    expect(JSON.parse(http.mock.calls[0][0].data)).toEqual({ firstName: null, lastName: null, phoneNumber });
  });
});

describe("Password rotation service boundary", () => {
  it("sends only the three password fields to the exact PUT endpoint and unwraps the Void response", async () => {
    seedSession();
    const http = vi.fn((config) => ({ ...ok(config), data: { code: 200, message: "Change password successfully" } }));
    setHttpHandler(http);
    const payload = { currentPassword: " CurrentPassword123 ", newPassword: " NewPassword456 ", verifyNewPassword: " NewPassword456 " };
    await expect(changePassword({ ...payload, firstName: "ignored", username: "ignored", userId: "ignored" })).resolves.toBeUndefined();
    expect(http).toHaveBeenCalledTimes(1);
    const config = http.mock.calls[0][0];
    expect(config).toMatchObject({ method: "put", url: "/users/me/password", refreshOnUnauthorized: false });
    expect(config.headers.Authorization).toMatch(/^Bearer /);
    expect(JSON.parse(config.data)).toEqual(payload);
    expect(config.validateStatus(200)).toBe(true);
    [201, 204, 400, 401, 500].forEach((status) => expect(config.validateStatus(status)).toBe(false));
  });
});
