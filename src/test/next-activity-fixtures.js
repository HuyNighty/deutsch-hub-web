import { afterEach, expect } from "vitest";
import { QueryObserver } from "@tanstack/react-query";
import { nextActivityKey, nextActivityOptions } from "@/features/my-learning/guidance/hooks/useNextActivity";
import { ok } from "./http";

export const nextActivityUrl = "/me/next-activity";
export const noActivity = { type: "NONE", target: null };
export const withNoActivity = (handler) => (config) => config.url === nextActivityUrl
  ? ok(config, noActivity) : handler(config);

const observers = [];
afterEach(() => {
  for (const { observer, verify } of observers.splice(0)) {
    try { verify(); } finally { observer.destroy(); }
  }
});

export function seedNextActivity(client, data = noActivity) {
  client.setQueryData(nextActivityKey, data);
  const original = client.getQueryData(nextActivityKey);
  const value = structuredClone(original);
  const suffix = [...nextActivityKey, "unrelated"];
  client.setQueryData(suffix, { saved: true });
  let reads = 0;
  const observer = new QueryObserver(client, { ...nextActivityOptions, staleTime: Infinity,
    queryFn: (...args) => { reads += 1; return nextActivityOptions.queryFn(...args); },
  });
  observer.subscribe(() => {});
  observers.push({ observer, verify: () => {
    expect(reads).toBe(0);
    expect(client.getQueryData(nextActivityKey)).toBe(original);
    expect(client.getQueryData(nextActivityKey)).toEqual(value);
    expect(client.getQueryState(suffix).isInvalidated).toBe(false);
    expect(client.getQueryData(suffix)).toEqual({ saved: true });
  } });
  return (invalidated) => {
    expect(client.getQueryData(nextActivityKey)).toBe(original);
    expect(client.getQueryData(nextActivityKey)).toEqual(value);
    expect(client.getQueryState(nextActivityKey).isInvalidated).toBe(invalidated);
    expect(client.getQueryState(suffix).isInvalidated).toBe(false);
    expect(client.getQueryData(suffix)).toEqual({ saved: true });
  };
}
