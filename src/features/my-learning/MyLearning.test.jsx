import { withNoActivity, nextActivityUrl } from "@/test/next-activity-fixtures";
import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp as baseAssessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { assessmentPage } from "@/features/assessment/test/fixtures";
import { journey, journeyUrl, courseSnapshot, liveAttempt } from "@/features/assessment/test/attempt-fixtures";

import { withDiscoverDirection, directionUrl } from "@/test/direction-fixtures";
const assessmentHttp = (handler, options) => baseAssessmentHttp(withNoActivity(withDiscoverDirection(handler)), options);

function expectSnapshotReads(http, count = 1) {
  expect(http.mock.calls.map(([config]) => [config.method, config.url, config.data]).sort())
    .toEqual([...Array.from({ length: count }, () => ["get", journeyUrl, undefined]), ["get", directionUrl, undefined], ["get", nextActivityUrl, undefined]].sort());
}

function expectNoPartialSnapshot() {
  expect(screen.queryByRole("region", { name: "Current German level" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Your courses" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Active assessments" })).not.toBeInTheDocument();
  expect(screen.queryByText("German Basics")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Assessment History" })).toHaveAttribute("href", "/my-learning/assessment-history");
}

describe("My Learning canonical Journey snapshot", () => {
  it("loads one Journey GET for level, nested Course progress and active Attempts without enrichment or mutations", async () => {
    const course = courseSnapshot();
    course.progress.completionPercentage = 73.25;
    const snapshot = journey([liveAttempt()], { currentLevel: "B1", courses: [course] });
    const http = assessmentHttp((config) => ok(config, snapshot));
    const { client } = mountAssessmentApp("/my-learning");
    await screen.findByRole("heading", { name: "German Basics" });
    expect(within(screen.getByRole("region", { name: "Current German level" })).getByText("B1")).toBeInTheDocument();
    expect(screen.getByText("Course level: A1")).toBeInTheDocument();
    expect(screen.getByText("3 / 8 lessons")).toBeInTheDocument();
    expect(screen.getByText("73.25%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "73.25");
    expect(screen.getByText("Continue your German learning journey.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue assessment" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assessment History" })).toHaveAttribute("href", "/my-learning/assessment-history");
    expect(client.getQueryData(["learner-learning-journey"])).toEqual(snapshot);
    expect(client.getQueryData(["my-courses"])).toBeUndefined();
    expect(client.getQueryData(["learner-competency"])).toBeUndefined();
    expect(snapshot.courses[0]).not.toHaveProperty("id");
    expect(snapshot.courses[0]).not.toHaveProperty("description");
    expectSnapshotReads(http);
  });

  it.each(["UNKNOWN", "B2"])("keeps current level %s independent of A1 Courses and no active Attempts", async (currentLevel) => {
    const http = assessmentHttp((config) => ok(config, journey([], { currentLevel, courses: [courseSnapshot()] })));
    mountAssessmentApp("/my-learning");
    await screen.findByRole("button", { name: "Continue Learning" });
    const region = screen.getByRole("region", { name: "Current German level" });
    expect(within(region).getByText(currentLevel === "UNKNOWN" ? "Not established yet" : "B2")).toBeInTheDocument();
    expect(region.textContent).not.toContain("UNKNOWN");
    expect(screen.getByText("Course level: A1")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Active assessments" })).not.toBeInTheDocument();
    const page = screen.getByRole("heading", { name: "My Learning", level: 1 }).closest("main");
    expect(page.textContent).not.toMatch(/new level|achieved|promot|earned|mismatch|recommend|next activity/i);
    expectSnapshotReads(http);
  });

  it("continues the Course using courseId and leaves the existing Course detail contract intact", async () => {
    const user = userEvent.setup();
    const course = courseSnapshot({ courseId: "course-canonical", enrollmentStatus: "ENROLLED" });
    const detail = { ...course, ...course.progress, description: "Existing Course detail", sections: [] };
    const http = assessmentHttp((config) => {
      if (config.url === journeyUrl) return ok(config, journey([], { courses: [course] }));
      if (config.url === "/me/courses/course-canonical") return ok(config, detail);
      throw new Error("Unexpected Course navigation request: " + config.url);
    }, { allowCourseDetailReads: true });
    const { router } = mountAssessmentApp("/my-learning");
    await screen.findByRole("button", { name: "Continue Learning" });
    expectSnapshotReads(http);
    expect(screen.queryByText("Existing Course detail")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue Learning" }));
    await screen.findByRole("heading", { name: "German Basics", level: 1 });
    expect(router.state.location.pathname).toBe("/my-learning/courses/course-canonical");
    expect(screen.getByText("Existing Course detail")).toBeInTheDocument();
    expect(http.mock.calls.map(([config]) => [config.method, config.url]).sort())
      .toEqual([["get", journeyUrl], ["get", directionUrl], ["get", nextActivityUrl], ["get", "/me/courses/course-canonical"]].sort());
  });

  it.each([false, true])("keeps discovery reachable with empty Courses: %s and fetches catalog only after click", async (empty) => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => {
      if (config.url === journeyUrl) return ok(config, journey([], { courses: empty ? [] : [courseSnapshot()] }));
      if (config.url === "/me/assessments") return ok(config, assessmentPage());
      throw new Error("Unexpected dashboard request: " + config.url);
    });
    const { router } = mountAssessmentApp("/my-learning");
    await screen.findByText(empty ? "No courses yet" : "German Basics");
    expect(screen.getByRole("heading", { name: "Assessments" })).toBeInTheDocument();
    const entry = screen.getByRole("link", { name: "Explore available assessments" });
    expect(entry).toHaveAttribute("href", "/my-learning/assessments");
    if (empty) expect(screen.getByText("Start learning your first course.")).toBeInTheDocument();
    expectSnapshotReads(http);
    await user.click(entry);
    await screen.findByRole("link", { name: "View assessment" });
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
    expect(http.mock.calls.map(([config]) => [config.method, config.url]).sort()).toEqual([["get", journeyUrl], ["get", directionUrl], ["get", nextActivityUrl], ["get", "/me/assessments"]].sort());
  });

  it("permits explicit catalog navigation while the Journey snapshot is still loading", async () => {
    const user = userEvent.setup();
    const response = deferred();
    const http = assessmentHttp((config) => {
      if (config.url === journeyUrl) return response.promise.then(() => ok(config, journey()));
      if (config.url === "/me/assessments") return ok(config, assessmentPage());
      throw new Error("Unexpected loading-state request: " + config.url);
    });
    const { router } = mountAssessmentApp("/my-learning");
    expect(screen.getByText("Đang tải...")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Explore available assessments" }));
    await screen.findByRole("link", { name: "View assessment" });
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([journeyUrl, directionUrl, nextActivityUrl, "/me/assessments"].sort());
    await act(async () => { response.resolve(); });
  });

  it("shows one snapshot error, keeps discovery usable and retries only Journey", async () => {
    const user = userEvent.setup();
    let failed = true;
    const http = assessmentHttp((config) => failed ? fail(config, 500) : ok(config, journey([], { currentLevel: "B1", courses: [courseSnapshot()] })));
    mountAssessmentApp("/my-learning");
    await screen.findByText("Đã xảy ra lỗi");
    expect(screen.getAllByRole("heading", { name: "Đã xảy ra lỗi" })).toHaveLength(1);
    expectNoPartialSnapshot();
    expectSnapshotReads(http);
    failed = false;
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByText("German Basics");
    expect(within(screen.getByRole("region", { name: "Current German level" })).getByText("B1")).toBeInTheDocument();
    expectSnapshotReads(http, 2);
  });

  it.each([
    ["domain", journey([liveAttempt()], { learningDomain: "GERMAN", courses: [courseSnapshot()] })],
    ["level", journey([liveAttempt()], { currentLevel: "INVALID", courses: [courseSnapshot()] })],
    ["Course", journey([liveAttempt()], { currentLevel: "B1", courses: [courseSnapshot({ progress: null })] })],
    ["Attempt", journey([liveAttempt({ status: "COMPLETED" })], { currentLevel: "B1", courses: [courseSnapshot()] })],
  ])("rejects invalid %s without partially rendering otherwise-valid snapshot data", async (_, snapshot) => {
    const http = assessmentHttp((config) => ok(config, snapshot));
    const { client } = mountAssessmentApp("/my-learning");
    await screen.findByText("Đã xảy ra lỗi");
    expectNoPartialSnapshot();
    expect(client.getQueryData(["learner-learning-journey"])).toBeUndefined();
    expectSnapshotReads(http);
  });

  it("uses one coherent error boundary when a refresh rejects a malformed snapshot after a valid load", async () => {
    let valid = true;
    const http = assessmentHttp((config) => ok(config, journey([liveAttempt()], {
      currentLevel: valid ? "B1" : "INVALID", courses: [courseSnapshot()],
    })));
    const { client } = mountAssessmentApp("/my-learning");
    await screen.findByText("German Basics");
    valid = false;
    await act(async () => { await client.refetchQueries({ queryKey: ["learner-learning-journey"], exact: true }); });
    await screen.findByText("Đã xảy ra lỗi");
    expectNoPartialSnapshot();
    expectSnapshotReads(http, 2);
  });
});
