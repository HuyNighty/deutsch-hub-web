import { withNoActivity, nextActivityUrl } from "@/test/next-activity-fixtures";
import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp as baseAssessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { ASSESSMENT_ID, assessmentDetail, assessmentPage } from "../test/fixtures";
import { liveAttempt, journey, courseSnapshot, resumedAttempt, journeyUrl, attemptPath, attemptUrl } from "../test/attempt-fixtures";

import { withDiscoverDirection, directionUrl } from "@/test/direction-fixtures";
const assessmentHttp = (handler, options) => baseAssessmentHttp(withNoActivity(withDiscoverDirection(handler)), options);

describe("My Learning active assessment boundary", () => {
  it("renders neutral cards and resume links from one whole Journey query, with no title enrichment or Start", async () => {
    const user = userEvent.setup();
    const snapshot = journey([liveAttempt(), liveAttempt({ assessmentAttemptId: "second-attempt", targetLevel: "C1" })], { courses: [courseSnapshot()] });
    const http = assessmentHttp((config) => {
      if (config.url === journeyUrl) return ok(config, snapshot);
      if (config.url === attemptUrl) return ok(config, resumedAttempt());
      if (config.url === attemptUrl + "/assessment") return ok(config, assessmentDetail());
      throw new Error("Unexpected request: " + config.url);
    });
    const { client, router } = mountAssessmentApp("/my-learning");
    const region = await screen.findByRole("region", { name: "Active assessments" });
    const links = within(region).getAllByRole("link", { name: "Continue assessment" });
    expect(within(region).getAllByRole("heading", { name: "Assessment in progress" })).toHaveLength(2);
    expect(within(region).getByText("Target level: B1")).toBeInTheDocument();
    expect(within(region).getByText("Target level: C1")).toBeInTheDocument();
    expect(region.textContent).not.toContain(ASSESSMENT_ID);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([attemptPath, "/my-learning/assessment-attempts/second-attempt"]);
    expect(client.getQueryData(["learner-learning-journey"])).toEqual(snapshot);
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([journeyUrl, directionUrl, nextActivityUrl].sort());
    await user.click(links[0]);
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([journeyUrl, directionUrl, nextActivityUrl, attemptUrl, attemptUrl + "/assessment"].sort());
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });

  it("renders no fake active card for an empty snapshot and preserves level and discovery", async () => {
    const http = assessmentHttp((config) => ok(config, journey()));
    const { client } = mountAssessmentApp("/my-learning");
    await screen.findByText("No courses yet");
    expect(client.getQueryData(["learner-learning-journey"])).toEqual(journey());
    expect(screen.queryByRole("heading", { name: "Assessment in progress" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Current German level" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(3);
  });

  it("keeps discovery usable through one Journey loading/error/retry boundary and explicit catalog navigation", async () => {
    const user = userEvent.setup();
    const read = deferred();
    let failed = true;
    const http = assessmentHttp((config) => {
      if (config.url === journeyUrl) return failed
        ? read.promise.then(() => fail(config, 500)) : ok(config, journey([liveAttempt()], { courses: [courseSnapshot()] }));
      if (config.url === "/me/assessments") return ok(config, assessmentPage());
      throw new Error("Unexpected request: " + config.url);
    });
    mountAssessmentApp("/my-learning");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
    await act(async () => { read.resolve(); });
    await screen.findByText("Something went wrong");
    expect(screen.getAllByRole("heading", { name: "Something went wrong" })).toHaveLength(1);
    expect(screen.queryByText("German Basics")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
    failed = false;
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByRole("link", { name: "Continue assessment" });
    expect(screen.getByRole("button", { name: "Continue Learning" })).toBeEnabled();
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([journeyUrl, journeyUrl, directionUrl, nextActivityUrl].sort());
    await user.click(screen.getByRole("link", { name: "Explore available assessments" }));
    await screen.findByRole("link", { name: "View assessment" });
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([journeyUrl, journeyUrl, directionUrl, nextActivityUrl, "/me/assessments"].sort());
  });

  it("keeps active resumes, current level and discovery visible with zero Courses", async () => {
    const http = assessmentHttp((config) => ok(config, journey([liveAttempt()], { currentLevel: "B1" })));
    mountAssessmentApp("/my-learning");
    await screen.findByText("No courses yet");
    expect(screen.getByRole("link", { name: "Continue assessment" })).toHaveAttribute("href", attemptPath);
    expect(within(screen.getByRole("region", { name: "Current German level" })).getByText("B1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
    expect(http).toHaveBeenCalledTimes(3);
  });

  it("rejects malformed Attempts without partially rendering valid Courses or current level", async () => {
    assessmentHttp((config) => ok(config, journey([liveAttempt(), liveAttempt({ assessmentId: " " })], { courses: [courseSnapshot()], currentLevel: "B1" })));
    mountAssessmentApp("/my-learning");
    await screen.findByText("Something went wrong");
    expect(screen.queryByText("German Basics")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Current German level" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
  });
});
