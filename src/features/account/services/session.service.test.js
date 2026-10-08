import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { ApiError } from "@/shared/api/api-error";
import { seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import { parseSessions } from "../session-response";
import { getSessions, revokeSession } from "./account.service";
import { otherSession, sessionRows } from "../test/session-rows";

describe("Canonical login sessions boundary", () => {
  it.each([undefined, null, {}, "sessions", 12])("rejects a non-list response %j", (value) => {
    expect(() => parseSessions(value)).toThrow(ApiError);
  });

  it.each([null, [], "session", 12])("rejects a non-object row %j", (row) => {
    expect(() => parseSessions([row])).toThrow(ApiError);
  });

  it.each([
    ...[undefined, null, "", "not-a-uuid", 12].map((value) => ["id", value]),
    ...["createdAt", "expiresAt"].flatMap((field) =>
      [undefined, null, "", 12, "not-a-date", "2026-10-08", "2026-10-08T10:00:00Z",
        "2026-10-08T10:00:00+07:00", "2026-02-29T10:00:00", "2026-13-08T10:00:00",
        "2026-04-31T10:00:00", "2026-10-08T24:00:00", "2026-10-08T10:60:00",
        "2026-10-08T10:00:60"].map((value) => [field, value])),
    ...[undefined, "", 12, "invalid", "2026-10-08T10:00:00Z"].map((value) => ["revokedAt", value]),
    ...["active", "current"].flatMap((field) => [undefined, null, "true", 0, 1].map((value) => [field, value])),
  ])("rejects malformed canonical %s: %j", (field, value) => {
    expect(() => parseSessions([{ ...otherSession, [field]: value }])).toThrow(ApiError);
  });

  it("accepts an honest empty list and preserves server ordering and raw timestamps", () => {
    const empty = [];
    expect(parseSessions(empty)).toBe(empty);
    expect(parseSessions(sessionRows)).toBe(sessionRows);
    expect(parseSessions(sessionRows).map(({ id }) => id)).toEqual(sessionRows.map(({ id }) => id));
  });

  it.each([[true, true], [true, false], [false, true], [false, false]])(
    "preserves independent active=%s/current=%s without inventing a current row",
    (active, current) => {
      const rows = [{ ...otherSession, active, current }];
      expect(parseSessions(rows)).toBe(rows);
    },
  );

  it.each(["2024-02-29T10:00", "2026-10-08T10:00:00.123456789"])("accepts local datetime %s unchanged", (createdAt) => {
    const rows = [{ ...otherSession, createdAt }];
    expect(parseSessions(rows)).toBe(rows);
  });
});

describe("Session management services", () => {
  it("GET uses the exact endpoint, validates the canonical list, and consumes the query AbortSignal", async () => {
    seedSession();
    const http = vi.fn((config) => ok(config, sessionRows));
    setHttpHandler(http);
    const controller = new AbortController();
    await expect(getSessions({ signal: controller.signal })).resolves.toEqual(sessionRows);
    expect(http).toHaveBeenCalledTimes(1);
    const config = http.mock.calls[0][0];
    expect(config).toMatchObject({ method: "get", url: "/users/me/sessions", signal: controller.signal });
    expect(config.headers.Authorization).toMatch(/^Bearer /);
    expect(config.data).toBeUndefined();
    expect(config.refreshOnUnauthorized).toBeUndefined();
    setHttpHandler((request) => ok(request, [{ ...otherSession, current: undefined }]));
    await expect(getSessions()).rejects.toBeInstanceOf(ApiError);
  });

  it("DELETE sends only the selected UUID in the path and unwraps the HTTP 200 Void response", async () => {
    seedSession();
    const http = vi.fn((config) => ({ ...ok(config), data: { code: 200, message: "Logout session successfully" } }));
    setHttpHandler(http);
    await expect(revokeSession(otherSession.id)).resolves.toBeUndefined();
    expect(http).toHaveBeenCalledTimes(1);
    const config = http.mock.calls[0][0];
    expect(config).toMatchObject({ method: "delete", url: `/users/me/sessions/${otherSession.id}` });
    expect(config.data).toBeUndefined();
    expect(config.params).toBeUndefined();
    expect(config.refreshOnUnauthorized).toBeUndefined();
    expect(config.requiresAuth).not.toBe(false);
    expect(config.validateStatus(200)).toBe(true);
    [201, 204, 400, 401, 404, 500].forEach((status) => expect(config.validateStatus(status)).toBe(false));
  });

  it("preserves SESSION_NOT_FOUND details from a definite DELETE failure", async () => {
    seedSession();
    setHttpHandler((config) => {
      throw new AxiosError("Session not found", AxiosError.ERR_BAD_REQUEST, config, null, {
        config, status: 404, headers: {}, data: { code: 4022, message: "Session not found" },
      });
    });
    await expect(revokeSession(otherSession.id)).rejects.toMatchObject({ status: 404, code: 4022, message: "Session not found" });
  });
});
