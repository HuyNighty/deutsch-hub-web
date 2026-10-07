import { nextActivityUrl, noActivity } from "@/test/next-activity-fixtures";
import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { assessmentDetail, assessmentPage } from "@/features/assessment/test/fixtures";
import {
  journey, courseSnapshot, liveAttempt, resumedAttempt, journeyUrl, attemptPath, attemptUrl,
} from "@/features/assessment/test/attempt-fixtures";

import { directionUrl, discoverDirection } from "@/test/direction-fixtures";

function dashboardSnapshot() {
  const course = courseSnapshot({ courseId: "journey-course-canonical" });
  course.progress.completionPercentage = 73.25;
  return journey([liveAttempt()], { currentLevel: "B2", courses: [course] });
}

function dashboardHttp(snapshot, destinations = {}, options = {}) {
  let destinationReadsAllowed = false;
  const http = assessmentHttp((config) => {
    expect(config.method).toBe("get");
    expect(config.data).toBeUndefined();
    if (config.url === nextActivityUrl) return ok(config, noActivity);
    if (config.url === directionUrl) return ok(config, discoverDirection);
    if (config.url === journeyUrl) return ok(config, snapshot);
    if (destinationReadsAllowed && Object.hasOwn(destinations, config.url)) {
      return ok(config, destinations[config.url]);
    }
    throw new Error("Unexpected dashboard acceptance request: " + config.url);
  }, options);
  return { http, allowDestinationReads: () => { destinationReadsAllowed = true; } };
}

function requests(http) {
  return http.mock.calls.map(([config]) => [config.method, config.url, config.data]);
}

async function expectDashboard(http) {
  const level = await screen.findByRole("region", { name: "Current German level" });
  const courses = screen.getByRole("region", { name: "Your courses" });
  const assessments = screen.getByRole("region", { name: "Active assessments" });

  expect(within(level).getByText("B2")).toBeVisible();
  expect(within(courses).getByRole("heading", { name: "German Basics" })).toBeVisible();
  expect(within(courses).getByText("Course level: A1")).toBeVisible();
  expect(within(courses).getByText("3 / 8 lessons")).toBeVisible();
  expect(within(courses).getByText("73.25%")).toBeVisible();
  expect(within(courses).getByRole("progressbar")).toHaveAttribute("value", "73.25");
  expect(within(courses).getByRole("progressbar")).toHaveAttribute("max", "100");
  expect(within(assessments).getByRole("heading", { name: "Assessment in progress" })).toBeVisible();
  expect(within(assessments).getByText("Target level: B1")).toBeVisible();
  expect(within(assessments).getByRole("link", { name: "Continue assessment" }))
    .toHaveAttribute("href", attemptPath);
  expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeVisible();

  const page = screen.getByRole("heading", { name: "My Learning", level: 1 }).closest("main");
  expect(page.textContent).not.toMatch(/new level|achieved|promot|earned|mismatch|downgrade|recommend|next activity/i);
  expect(requests(http).sort()).toEqual([["get", journeyUrl, undefined], ["get", directionUrl, undefined], ["get", nextActivityUrl, undefined]].sort());
}

describe("Learner dashboard integrated acceptance", () => {
  it("A: enters from the global Header and composes B2 level, A1 Course and B1 active Attempt from one Journey read", async () => {
    const user = userEvent.setup();
    const { http } = dashboardHttp(dashboardSnapshot());
    const { router } = mountAssessmentApp("/experiences");
    await act(async () => {});
    const header = within(screen.getByRole("banner"));
    const myLearning = header.getByRole("link", { name: "My Learning", exact: true });

    expect(header.getByRole("link", { name: "Learning", exact: true })).toHaveAttribute("href", "/learn-german");
    expect(myLearning).toBeVisible();
    expect(myLearning).toHaveAttribute("href", "/my-learning");
    expect(header.getByRole("link", { name: /Account/ })).toHaveAttribute("href", "/account");
    expect(router.state.location.pathname).toBe("/experiences");
    expect(requests(http)).toEqual([]);

    await user.click(myLearning);
    await expectDashboard(http);
    expect(router.state.location.pathname).toBe("/my-learning");
  });

  it("B: continues the Journey Course by courseId and reads its detail only after Continue Learning", async () => {
    const user = userEvent.setup();
    const snapshot = dashboardSnapshot();
    const course = snapshot.courses[0];
    const courseUrl = `/me/courses/${course.courseId}`;
    const detail = { ...course, ...course.progress, description: "Existing enrolled Course detail", sections: [] };
    const { http, allowDestinationReads } = dashboardHttp(snapshot, { [courseUrl]: detail }, { allowCourseDetailReads: true });
    const { router } = mountAssessmentApp("/my-learning");
    await expectDashboard(http);
    expect(course).not.toHaveProperty("id");
    expect(screen.queryByText(detail.description)).not.toBeInTheDocument();

    allowDestinationReads();
    await user.click(screen.getByRole("button", { name: "Continue Learning" }));
    await screen.findByRole("heading", { name: course.title, level: 1 });
    expect(screen.getByText(detail.description)).toBeVisible();
    expect(router.state.location.pathname).toBe(`/my-learning/courses/${course.courseId}`);
    expect(requests(http).sort()).toEqual([["get", journeyUrl, undefined], ["get", directionUrl, undefined], ["get", nextActivityUrl, undefined], ["get", courseUrl, undefined]].sort());
  });

  it("C: resumes the existing active Attempt only after Continue assessment without starting another Attempt", async () => {
    const user = userEvent.setup();
    const attempt = resumedAttempt();
    const definition = assessmentDetail();
    const { http, allowDestinationReads } = dashboardHttp(dashboardSnapshot(), {
      [attemptUrl]: attempt,
      [`${attemptUrl}/assessment`]: definition,
    });
    const { router, client } = mountAssessmentApp("/my-learning");
    await expectDashboard(http);
    expect(screen.queryByRole("heading", { name: definition.title })).not.toBeInTheDocument();

    allowDestinationReads();
    await user.click(screen.getByRole("link", { name: "Continue assessment" }));
    const region = await screen.findByRole("region", { name: "Assessment attempt" });
    expect(await within(region).findByText("Status: In progress")).toBeVisible();
    expect(within(region).getByRole("heading", { name: definition.title })).toBeVisible();
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(client.getQueryData(["learner-assessment-attempt", attempt.assessmentAttemptId])).toEqual(attempt);
    // The destination's two independent reads have no required scheduling order.
    expect(requests(http).slice(3).sort()).toEqual([
      ["get", attemptUrl, undefined], ["get", `${attemptUrl}/assessment`, undefined],
    ].sort());
    expect(requests(http).slice(0, 3).sort()).toEqual([["get", journeyUrl, undefined], ["get", directionUrl, undefined], ["get", nextActivityUrl, undefined]].sort());
  });

  it("D: discovers the existing Assessment catalog only after Explore available assessments", async () => {
    const user = userEvent.setup();
    const page = assessmentPage();
    const { http, allowDestinationReads } = dashboardHttp(dashboardSnapshot(), { "/me/assessments": page });
    const { router } = mountAssessmentApp("/my-learning");
    await expectDashboard(http);
    expect(screen.queryByRole("link", { name: "View assessment" })).not.toBeInTheDocument();

    allowDestinationReads();
    await user.click(screen.getByRole("link", { name: "Explore available assessments" }));
    const view = await screen.findByRole("link", { name: "View assessment" });
    expect(view).toBeVisible();
    expect(view).toHaveAttribute("href", `/my-learning/assessments/${page.items[0].assessmentId}`);
    expect(screen.getByRole("heading", { name: page.items[0].title })).toBeVisible();
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
    expect(requests(http).sort()).toEqual([["get", journeyUrl, undefined], ["get", directionUrl, undefined], ["get", nextActivityUrl, undefined], ["get", "/me/assessments", undefined]].sort());
  });
});
