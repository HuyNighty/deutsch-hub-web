import { describe, it, expect, vi } from "vitest";
import { act } from "@testing-library/react";
import { api, apiV2 } from "./axios";
import { getAccessToken, getRefreshToken } from "@/shared/auth/token";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";
import { mountSession, seedSession, refreshResult } from "@/test/session-fixtures";

describe("authenticated HTTP coordination", () => {
  it("shares one refresh across two concurrent v1/v2 401s, persists once and retries both", async () => {
    seedSession();
    const { auth, client } = mountSession();
    client.setQueryData(["sentinel"], "same learner");
    const response = deferred();
    const both401 = deferred();
    let rejected = 0;
    let refreshes = 0;
    const attempts = {};
    const rotated = refreshResult();
    const stored = vi.spyOn(Storage.prototype, "setItem");
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") {
        refreshes += 1;
        return response.promise.then(() => ok(config, rotated));
      }
      attempts[config.url] = (attempts[config.url] ?? 0) + 1;
      if (attempts[config.url] === 1) {
        rejected += 1;
        if (rejected === 2) both401.resolve();
        return fail(config);
      }
      expect(config.headers.Authorization).toBe(`Bearer ${rotated.accessToken}`);
      return ok(config, config.url);
    });

    let one;
    let two;
    await act(async () => {
      one = api.get("/one");
      two = apiV2.get("/two");
      await both401.promise;
    });
    expect(refreshes).toBe(1);
    await act(async () => { response.resolve(); await Promise.all([one, two]); });
    expect(attempts).toEqual({ "/one": 2, "/two": 2 });
    expect(refreshes).toBe(1);
    expect(getAccessToken()).toBe(rotated.accessToken);
    expect(getRefreshToken()).toBe(rotated.refreshToken);
    expect(stored.mock.calls.filter(([key]) => key === "access_token")).toHaveLength(1);
    expect(stored.mock.calls.filter(([key]) => key === "refresh_token")).toHaveLength(1);
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(client.getQueryData(["sentinel"])).toBe("same learner");
  });

  it("uses an already rotated token for a delayed same-generation 401 without another refresh", async () => {
    seedSession();
    mountSession();
    const delayed = deferred();
    const started = deferred();
    let refreshes = 0;
    const attempts = {};
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") { refreshes += 1; return ok(config, refreshResult()); }
      attempts[config.url] = (attempts[config.url] ?? 0) + 1;
      if (attempts[config.url] > 1) return ok(config, "retried");
      if (config.url === "/delayed") {
        started.resolve();
        return delayed.promise.then(() => fail(config));
      }
      return fail(config);
    });
    const late = api.get("/delayed");
    await act(async () => { await started.promise; await api.get("/first"); });
    await act(async () => { delayed.resolve(); await late; });
    expect(refreshes).toBe(1);
  });

  it("terminates on a retry 401 with no second refresh and clears provider, tokens and cache", async () => {
    seedSession();
    const { auth, client } = mountSession();
    client.setQueryData(["sentinel"], "old viewer");
    let refreshes = 0;
    let attempts = 0;
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") { refreshes += 1; return ok(config, refreshResult()); }
      attempts += 1;
      return fail(config);
    });
    await act(async () => { await expect(api.get("/private")).rejects.toThrow(); });
    expect(attempts).toBe(2);
    expect(refreshes).toBe(1);
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
  });

  it("terminates on refresh HTTP failure using the same provider and cache path", async () => {
    seedSession();
    const { auth, client } = mountSession();
    client.setQueryData(["sentinel"], "old viewer");
    let refreshes = 0;
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") refreshes += 1;
      return fail(config);
    });
    await act(async () => { await expect(api.get("/private")).rejects.toThrow(); });
    expect(refreshes).toBe(1);
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
  });

  it("never refreshes or terminates for public/auth endpoint 401 responses", async () => {
    seedSession();
    const { auth, client } = mountSession();
    client.setQueryData(["sentinel"], "learner");
    const http = vi.fn((config) => fail(config));
    setHttpHandler(http);
    await expect(api.get("/public", { requiresAuth: false })).rejects.toThrow();
    await expect(api.post("/auth/login", {})).rejects.toThrow();
    expect(http).toHaveBeenCalledTimes(2);
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(client.getQueryData(["sentinel"])).toBe("learner");
  });
});
