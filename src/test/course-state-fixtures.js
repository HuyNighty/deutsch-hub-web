import { afterEach, expect } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { learningJourneyKey, learningJourneyOptions } from "@/features/assessment/attempt/hooks/useLearningJourney";
import { journey, courseSnapshot } from "@/features/assessment/test/attempt-fixtures";

import { seedDirection } from "./direction-fixtures";
import { learningDirectionKey } from "@/features/my-learning/guidance/hooks/useLearningDirection";

export const COURSE_ID = "course-one";
const observers = [];
afterEach(() => { observers.splice(0).forEach((observer) => observer.destroy()); });

export function seedCourseState() {
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity }, mutations: { retry: false },
  } });
  const course = courseSnapshot({ courseId: COURSE_ID });
  client.setQueryData(learningJourneyKey, journey([], { currentLevel: "B2", courses: [course] }));
  client.setQueryData(["my-courses"], [course]);
  client.setQueryData(["my-courses", COURSE_ID], {
    ...course, ...course.progress, description: "Existing Course detail", sections: [],
  });
  const unrelated = [
    [...learningJourneyKey, "unrelated"], ["learner-competency"],
    ["learner-assessment-result", "unrelated"], ["learner-assessment-attempt", "unrelated"],
    ["learner-assessment-task-quiz", "unrelated", "task"],
  ];
  unrelated.forEach((key) => client.setQueryData(key, { sentinel: "unchanged" }));
  seedDirection(client);
  const originals = client.getQueryCache().getAll().map((query) => ({
    key: query.queryKey, data: query.state.data, value: structuredClone(query.state.data),
  }));
  // An active, fresh canonical observer would expose accidental eager refetching.
  const observer = new QueryObserver(client, { ...learningJourneyOptions, staleTime: Infinity });
  observer.subscribe(() => {});
  observers.push(observer);
  expect(client.getQueryCache().find({ queryKey: learningJourneyKey, exact: true }).isActive()).toBe(true);
  expect(client.getQueryState(learningJourneyKey).isInvalidated).toBe(false);
  return { client, originals };
}

export function expectCourseState({ client, originals }, invalidated = false) {
  for (const { key, data, value } of originals) {
    expect(client.getQueryData(key)).toBe(data);
    expect(client.getQueryData(key)).toEqual(value);
    const affected = key[0] === "my-courses" || JSON.stringify(key) === JSON.stringify(learningJourneyKey) || JSON.stringify(key) === JSON.stringify(learningDirectionKey);
    expect(client.getQueryState(key).isInvalidated).toBe(invalidated && affected);
  }
}
