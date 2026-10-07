import { afterEach, expect } from "vitest";
import { QueryObserver } from "@tanstack/react-query";
import { learningDirectionKey, learningDirectionOptions } from "@/features/my-learning/guidance/hooks/useLearningDirection";
import { ok } from "./http";

export const directionUrl = "/me/learning-direction";
export const discoverDirection = { type: "DISCOVER_COURSE", target: null };
export const withDiscoverDirection = (handler) => (config) => config.url === directionUrl
  ? ok(config, discoverDirection) : handler(config);

const observers = [];
afterEach(() => {
  for (const { observer, verify } of observers.splice(0)) {
    try { verify(); } finally { observer.destroy(); }
  }
});

export function seedDirection(client, data = discoverDirection) {
  client.setQueryData(learningDirectionKey, data);
  const original = client.getQueryData(learningDirectionKey);
  const suffix = [...learningDirectionKey, "unrelated"];
  client.setQueryData(suffix, { saved: true });
  let reads = 0;
  const observer = new QueryObserver(client, { ...learningDirectionOptions, staleTime: Infinity,
    queryFn: (...args) => { reads += 1; return learningDirectionOptions.queryFn(...args); },
  });
  observer.subscribe(() => {});
  observers.push({ observer, verify: () => {
    expect(reads).toBe(0);
    expect(client.getQueryData(learningDirectionKey)).toBe(original);
    expect(client.getQueryData(learningDirectionKey)).toEqual(data);
    expect(client.getQueryState(suffix).isInvalidated).toBe(false);
  } });
  return (invalidated) => {
    expect(client.getQueryData(learningDirectionKey)).toBe(original);
    expect(client.getQueryData(learningDirectionKey)).toEqual(data);
    expect(client.getQueryState(learningDirectionKey).isInvalidated).toBe(invalidated);
    expect(client.getQueryState(suffix).isInvalidated).toBe(false);
    expect(client.getQueryData(suffix)).toEqual({ saved: true });
  };
}
