import { nextActivityUrl, noActivity } from "@/test/next-activity-fixtures";
import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { journey, journeyUrl, courseSnapshot, liveAttempt } from "@/features/assessment/test/attempt-fixtures";
import { directionUrl, discoverDirection } from "@/test/direction-fixtures";
import { learningDirectionKey, learningDirectionOptions } from "./hooks/useLearningDirection";
import { getLearningDirection } from "./direction.service";

const snapshot = () => journey([liveAttempt()], { currentLevel: "B2", courses: [courseSnapshot()] });
const requests = (http) => http.mock.calls.map(([config]) => [config.method, config.url, config.data]).sort();
const expected = (...urls) => urls.map((url) => ["get", url, undefined]).sort();
const guidance = () => within(screen.getByRole("region", { name: "Learning guidance" }));
function readHttp(direction, journeyHandler = (config) => ok(config, snapshot())) {
  return assessmentHttp((config) => {
    if (config.url === nextActivityUrl) return ok(config, noActivity);
    if (config.url === journeyUrl) return journeyHandler(config);
    if (config.url === directionUrl) return typeof direction === "function" ? direction(config) : ok(config, direction);
    throw new Error("No guidance enrichment: " + config.url);
  });
}
function expectJourney() {
  expect(screen.getByText("German Basics")).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Current German level" })).getByText("B2")).toBeVisible();
  expect(screen.getByRole("region", { name: "Active assessments" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeVisible();
}

describe("Learning Guidance independent resource", () => {
  it.each([
    [{ type: "RESUME_ASSESSMENT", target: { assessmentAttemptId: "absent /?#" } }, "You have an assessment in progress.", "Continue assessment", "/my-learning/assessment-attempts/absent%20%2F%3F%23"],
    [{ type: "CONTINUE_COURSE", target: { courseId: "absent /?#" } }, "Continue the course you are currently working on.", "Continue course", "/my-learning/courses/absent%20%2F%3F%23"],
    [discoverDirection, "Choose a course to begin or continue your German learning.", "Explore courses", "/learn-german"],
  ])("renders Backend-selected %j without inference, enrichment or navigation", async (direction, text, label, href) => {
    const http = readHttp(direction);
    const { router, client } = mountAssessmentApp("/my-learning");
    await guidance().findByRole("link", { name: label });
    await screen.findByText("German Basics");
    expect(guidance().getByText(text)).toBeVisible();
    expect(guidance().getByRole("link", { name: label })).toHaveAttribute("href", href);
    expectJourney();
    expect(router.state.location.pathname).toBe("/my-learning");
    expect(client.getQueryData(learningDirectionKey)).toEqual(direction);
    expect(learningDirectionOptions).toMatchObject({ queryKey: learningDirectionKey, queryFn: getLearningDirection, retry: false });
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
    const page = screen.getByRole("heading", { name: "My Learning", level: 1 }).closest("main");
    const sections = [...page.children];
    expect(sections.indexOf(screen.getByRole("region", { name: "Learning guidance" })))
      .toBeLessThan(sections.indexOf(screen.getByRole("region", { name: "Assessments" })));
    expect(page.textContent).not.toMatch(/next activity|next step|recommended|do this now|AI recommendation/i);
  });

  it("keeps Journey and discovery usable while Direction is pending", async () => {
    const gate = deferred();
    const http = readHttp((config) => gate.promise.then(() => ok(config, discoverDirection)));
    mountAssessmentApp("/my-learning");
    await screen.findByText("German Basics");
    expect(guidance().getByText("Loading learning guidance...")).toBeVisible();
    expectJourney();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
    await act(async () => { gate.resolve(); });
    expect(await guidance().findByRole("link", { name: "Explore courses" })).toBeVisible();
  });

  it("isolates Direction failure and retries only Direction while retaining Journey", async () => {
    let failed = true;
    const http = readHttp((config) => failed ? fail(config, 500) : ok(config, discoverDirection));
    mountAssessmentApp("/my-learning");
    await guidance().findByRole("button", { name: "Try Again" });
    await screen.findByText("German Basics");
    expectJourney();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
    failed = false;
    await userEvent.setup().click(guidance().getByRole("button", { name: "Try Again" }));
    await guidance().findByRole("link", { name: "Explore courses" });
    expectJourney();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl, directionUrl));
  });

  it("keeps Direction actionable when Journey fails", async () => {
    const http = readHttp(discoverDirection, (config) => fail(config, 500));
    mountAssessmentApp("/my-learning");
    expect(await guidance().findByRole("link", { name: "Explore courses" })).toBeVisible();
    await screen.findByRole("button", { name: "Try Again" });
    expect(guidance().queryByRole("button", { name: "Try Again" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeVisible();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
  });

  it("rejects malformed 2xx Direction without Journey fallback, collapse or navigation", async () => {
    const http = readHttp({ type: "RESUME_ASSESSMENT", target: { courseId: "wrong" } });
    const { router, client } = mountAssessmentApp("/my-learning");
    await guidance().findByRole("button", { name: "Try Again" });
    await screen.findByText("German Basics");
    expectJourney();
    expect(guidance().queryByRole("link")).not.toBeInTheDocument();
    expect(client.getQueryState(learningDirectionKey).error.message).toBe("The server returned an invalid learning direction response.");
    expect(router.state.location.pathname).toBe("/my-learning");
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
  });
});
