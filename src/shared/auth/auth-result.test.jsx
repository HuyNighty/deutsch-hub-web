import { describe, it, expect, vi } from "vitest";
import { act } from "@testing-library/react";
import { login } from "@/features/auth/login/services/login.service";
import { api } from "@/shared/api/axios";
import { getAccessToken, getRefreshToken } from "./token";
import { mountSession, seedSession, token, loginResult, refreshResult } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";

const invalidLoginResults = [
  ["null result", () => null],
  ["array result", () => []],
  ["missing access token", (value) => ({ ...value, accessToken: undefined })],
  ["blank refresh token", (value) => ({ ...value, refreshToken: " " })],
  ["negative expiry", (value) => ({ ...value, accessTokenExpiresIn: -1 })],
  ["nonfinite expiry", (value) => ({ ...value, accessTokenExpiresIn: Infinity })],
  ["string expiry", (value) => ({ ...value, accessTokenExpiresIn: "3600" })],
  ["missing user", (value) => ({ ...value, user: null })],
  ["unusable user", (value) => ({ ...value, user: { id: "learner-b" } })],
  ["mismatched user identity", (value) => ({ ...value, user: { ...value.user, id: "another" } })],
  ["undecodable JWT", (value) => ({ ...value, accessToken: "not-a-jwt" })],
  ["expired JWT", (value) => ({ ...value, accessToken: token("learner-b", 1) })],
  ["JWT without identity", (value) => ({ ...value, accessToken: token("") })],
  ["JWT with malformed roles", (value) => ({ ...value, accessToken: `h.${btoa(JSON.stringify({
    sub: "learner-b", roles: "LEARNER", exp: Math.floor(Date.now() / 1000) + 3600,
  }))}.s` })],
];
const invalidRefreshResults = [
  ["null result", () => null],
  ["missing access token", (value) => ({ ...value, accessToken: undefined })],
  ["blank refresh token", (value) => ({ ...value, refreshToken: " " })],
  ["missing expiry", (value) => ({ ...value, expiresIn: undefined })],
  ["negative expiry", (value) => ({ ...value, expiresIn: -1 })],
  ["nonfinite expiry", (value) => ({ ...value, expiresIn: NaN })],
  ["string expiry", (value) => ({ ...value, expiresIn: "3600" })],
  ["undecodable JWT", (value) => ({ ...value, accessToken: "broken" })],
  ["expired JWT", (value) => ({ ...value, accessToken: token("learner-a", 1) })],
];

describe("narrow auth response validation", () => {
  it.each(invalidLoginResults)("rejects Login 200 with %s without overwriting the current session", async (_, invalid) => {
    seedSession();
    const previousAccess = getAccessToken();
    const previousRefresh = getRefreshToken();
    const { auth, client } = mountSession();
    client.setQueryData(["sentinel"], "current session data");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    setHttpHandler((config) => ok(config, invalid(loginResult())));
    await act(async () => {
      await expect(login({ usernameOrEmail: "learner", password: "password" }).then(auth.current.setSession))
        .rejects.toThrow();
    });
    expect(getAccessToken()).toBe(previousAccess);
    expect(getRefreshToken()).toBe(previousRefresh);
    expect(auth.current.user.id).toBe("learner-a");
    expect(client.getQueryData(["sentinel"])).toBe("current session data");
    expect(storage).not.toHaveBeenCalled();
  });

  it("rejects malformed Login 200 from anonymous without applying any tokens", async () => {
    const { auth } = mountSession();
    setHttpHandler((config) => ok(config, { accessToken: token() }));
    await act(async () => {
      await expect(login({}).then(auth.current.setSession)).rejects.toThrow();
    });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it.each(invalidRefreshResults)("terminates current session for Refresh 200 with %s, without partial persistence", async (_, invalid) => {
    seedSession();
    const { auth, client } = mountSession();
    client.setQueryData(["sentinel"], "old data");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    let refreshes = 0;
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") {
        refreshes += 1;
        return ok(config, invalid(refreshResult()));
      }
      // Trigger the actual interceptor and shared refresh path.
      return Promise.reject({ config, response: { status: 401 } });
    });
    await act(async () => { await expect(api.get("/private")).rejects.toThrow(); });
    expect(refreshes).toBe(1);
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    expect(storage).not.toHaveBeenCalled();
  });

  it("rejects an invalid Refresh ApiResponse envelope during bootstrap", async () => {
    seedSession({ expired: true });
    setHttpHandler((config) => ({ ...ok(config, refreshResult()), data: { result: refreshResult() } }));
    const { auth, client } = mountSession();
    await act(async () => {});
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("accepts the backend's finite zero expiry field when the JWT still establishes valid auth", async () => {
    const { auth } = mountSession();
    const result = { ...loginResult(), accessTokenExpiresIn: 0 };
    setHttpHandler((config) => ok(config, result));
    await act(async () => { auth.current.setSession(await login({})); });
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(getAccessToken()).toBe(result.accessToken);
    expect(getRefreshToken()).toBe(result.refreshToken);
  });
});
