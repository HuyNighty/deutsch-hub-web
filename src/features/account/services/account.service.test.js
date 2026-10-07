import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/api-error";
import { seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { account } from "../test/account-fixtures";
import { parseAccount } from "../account-response";
import { getAccount, updateProfile } from "./account.service";

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
