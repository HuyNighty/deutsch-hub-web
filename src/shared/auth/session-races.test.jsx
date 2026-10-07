import { describe, it, expect } from "vitest";
import { act } from "@testing-library/react";
import { api } from "@/shared/api/axios";
import { getAccessToken, getRefreshToken } from "./token";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";
import { mountSession, seedSession, loginResult, refreshResult } from "@/test/session-fixtures";

function pendingRefresh() {
  const started = deferred();
  const response = deferred();
  let refreshes = 0;
  setHttpHandler((config) => {
    if (config.url === "/auth/refresh") {
      refreshes += 1;
      started.resolve();
      return response.promise.then((result) => ok(config, result));
    }
    return fail(config);
  });
  const request = api.get("/old-private").catch((error) => error);
  return { started, response, request, refreshCount: () => refreshes };
}

describe("logical session races", () => {
  it("captures request ownership before a same-turn session replacement", async () => {
    seedSession();
    const { auth, client } = mountSession();
    const response = deferred();
    let refreshes = 0;
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") {
        refreshes += 1;
        return ok(config, refreshResult());
      }
      return response.promise.then(() => fail(config));
    });
    const oldRequest = api.get("/private").catch((error) => error);
    const sessionB = loginResult();
    act(() => { auth.current.setSession(sessionB); });
    client.setQueryData(["sentinel"], "B");
    await act(async () => { response.resolve(); await oldRequest; });
    expect(refreshes).toBe(0);
    expect(auth.current.user.id).toBe("learner-b");
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["sentinel"])).toBe("B");
  });

  it("discards a late successful refresh after local logout, including cached old data", async () => {
    seedSession();
    const { auth, client } = mountSession();
    client.setQueryData(["sentinel"], "old learner");
    const pending = pendingRefresh();
    await act(async () => { await pending.started.promise; auth.current.logout(); });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    await act(async () => { pending.response.resolve(refreshResult()); await pending.request; });
    expect(auth.current.status).toBe("ANONYMOUS");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    expect(pending.refreshCount()).toBe(1);
  });

  it.each(["success", "failure"])("keeps new login authoritative when old refresh ends in %s", async (outcome) => {
    seedSession();
    const { auth, client, observations } = mountSession();
    client.setQueryData(["sentinel"], "session A viewer");
    const pending = pendingRefresh();
    const sessionB = loginResult();
    await act(async () => { await pending.started.promise; auth.current.setSession(sessionB); });
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    expect(observations.filter((item) => item.status === "AUTHENTICATED").at(-1).cache).toBeUndefined();
    client.setQueryData(["sentinel"], "session B viewer");
    await act(async () => {
      if (outcome === "success") pending.response.resolve(refreshResult());
      else pending.response.reject(new Error("Old refresh failed"));
      await pending.request;
    });
    expect(auth.current.user.id).toBe("learner-b");
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["sentinel"])).toBe("session B viewer");
  });

  it.each(["login", "logout"])("ignores a late old request 401 after %s", async (transition) => {
    seedSession();
    const { auth, client } = mountSession();
    const started = deferred();
    const response = deferred();
    let refreshes = 0;
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") { refreshes += 1; return ok(config, refreshResult()); }
      started.resolve();
      return response.promise.then(() => fail(config));
    });
    const request = api.get("/old-private").catch((error) => error);
    const sessionB = loginResult();
    await act(async () => {
      await started.promise;
      if (transition === "login") auth.current.setSession(sessionB);
      else auth.current.logout();
    });
    client.setQueryData(["sentinel"], "new generation data");
    await act(async () => { response.resolve(); await request; });
    expect(refreshes).toBe(0);
    expect(auth.current.status).toBe(transition === "login" ? "AUTHENTICATED" : "ANONYMOUS");
    expect(getAccessToken()).toBe(transition === "login" ? sessionB.accessToken : null);
    expect(getRefreshToken()).toBe(transition === "login" ? sessionB.refreshToken : null);
    expect(client.getQueryData(["sentinel"])).toBe("new generation data");
  });

  it("ignores a late terminal retry 401 from a replaced session", async () => {
    seedSession();
    const { auth, client } = mountSession();
    const retryStarted = deferred();
    const retryResponse = deferred();
    let refreshes = 0;
    let attempts = 0;
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") { refreshes += 1; return ok(config, refreshResult()); }
      attempts += 1;
      if (attempts === 1) return fail(config);
      retryStarted.resolve();
      return retryResponse.promise.then(() => fail(config));
    });
    const request = api.get("/private").catch((error) => error);
    const sessionB = loginResult();
    await act(async () => { await retryStarted.promise; auth.current.setSession(sessionB); });
    client.setQueryData(["sentinel"], "B");
    await act(async () => { retryResponse.resolve(); await request; });
    expect(refreshes).toBe(1);
    expect(auth.current.user.id).toBe("learner-b");
    expect(getAccessToken()).toBe(sessionB.accessToken);
    expect(getRefreshToken()).toBe(sessionB.refreshToken);
    expect(client.getQueryData(["sentinel"])).toBe("B");
  });

  it("lets a newer generation refresh independently while the old refresh is pending", async () => {
    seedSession();
    const { auth, client } = mountSession();
    const oldStarted = deferred();
    const oldResponse = deferred();
    const newStarted = deferred();
    const newResponse = deferred();
    let refreshes = 0;
    const attempts = {};
    setHttpHandler((config) => {
      if (config.url === "/auth/refresh") {
        refreshes += 1;
        const old = JSON.parse(config.data).refreshToken === "original-learner-a";
        (old ? oldStarted : newStarted).resolve();
        return (old ? oldResponse : newResponse).promise.then((result) => ok(config, result));
      }
      attempts[config.url] = (attempts[config.url] ?? 0) + 1;
      if (attempts[config.url] > 1) return ok(config, "retried");
      return fail(config);
    });
    const oldRequest = api.get("/old").catch((error) => error);
    await act(async () => { await oldStarted.promise; auth.current.setSession(loginResult()); });
    client.setQueryData(["sentinel"], "B");
    const newRequest = api.get("/new");
    await act(async () => { await newStarted.promise; });
    expect(refreshes).toBe(2);
    // Completing the old flight must neither overwrite B nor detach B's flight.
    await act(async () => { oldResponse.resolve(refreshResult()); await oldRequest; });
    const concurrentNew = api.get("/new-two");
    const rotatedB = refreshResult("learner-b");
    await act(async () => { newResponse.resolve(rotatedB); await Promise.all([newRequest, concurrentNew]); });
    expect(refreshes).toBe(2);
    expect(getAccessToken()).toBe(rotatedB.accessToken);
    expect(getRefreshToken()).toBe(rotatedB.refreshToken);
    expect(auth.current.user.id).toBe("learner-b");
    expect(client.getQueryData(["sentinel"])).toBe("B");
  });

  it("cancels an old query so late successful data cannot repopulate cache after replacement", async () => {
    seedSession();
    const { auth, client } = mountSession();
    const started = deferred();
    const response = deferred();
    setHttpHandler((config) => {
      started.resolve();
      return response.promise.then(() => ok(config, "A's private data"));
    });
    const query = client.fetchQuery({ queryKey: ["sentinel"], queryFn: () => api.get("/private") }).catch((error) => error);
    await act(async () => { await started.promise; auth.current.setSession(loginResult()); });
    await act(async () => { response.resolve(); await query; });
    expect(client.getQueryData(["sentinel"])).toBeUndefined();
    expect(auth.current.user.id).toBe("learner-b");
  });
});
