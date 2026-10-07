import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { ASSESSMENT_ID, assessmentDetail, assessmentPage } from "../test/fixtures";
import { liveAttempt, journey, resumedAttempt, journeyUrl, attemptPath, attemptUrl } from "../test/attempt-fixtures";

const courses = [{ id: "course", courseId: "course", title: "German Basics",
  completedLessons: 0, totalLessons: 10, completionPercentage: 0 }];

describe("My Learning active assessment boundary", () => {
  it("renders neutral cards and resume links using one Journey query, with no title enrichment", async () => {
    const user = userEvent.setup();
    const snapshot = journey([liveAttempt(), liveAttempt({ assessmentAttemptId: "second-attempt", targetLevel: "C1" })]);
    const http = assessmentHttp((config) => {
      if (config.url === "/me/courses") return ok(config, courses);
      if (config.url === journeyUrl) return ok(config, snapshot);
      if (config.url === attemptUrl) return ok(config, resumedAttempt());
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      throw new Error(`Unexpected request: ${config.url}`);
    });
    const { client, router } = mountAssessmentApp("/my-learning");
    const region = await screen.findByRole("region", { name: "Active assessments" });
    const links = await within(region).findAllByRole("link", { name: "Continue assessment" });
    expect(within(region).getAllByRole("heading", { name: "Assessment in progress" })).toHaveLength(2);
    expect(within(region).getByText("Target level: B1")).toBeInTheDocument();
    expect(within(region).getByText("Target level: C1")).toBeInTheDocument();
    expect(region.textContent).not.toContain(ASSESSMENT_ID);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([attemptPath, "/my-learning/assessment-attempts/second-attempt"]);
    expect(client.getQueryData(["learner-learning-journey"])).toEqual(snapshot);
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual(["/me/courses", journeyUrl].sort());
    await user.click(links[0]);
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
  });

  it("renders no fake active card for an empty index and preserves discovery", async () => {
    assessmentHttp((config) => ok(config, config.url === journeyUrl ? journey() : []));
    const { client } = mountAssessmentApp("/my-learning");
    await screen.findByText("No courses yet");
    expect(client.getQueryData(["learner-learning-journey"])).toEqual(journey());
    expect(screen.queryByRole("heading", { name: "Assessment in progress" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
  });

  it("keeps Courses and discovery usable through Journey loading, failure, retry and catalog navigation", async () => {
    const user = userEvent.setup();
    const read = deferred();
    let failed = true;
    const http = assessmentHttp((config) => {
      if (config.url === "/me/courses") return ok(config, courses);
      if (config.url === journeyUrl) return failed
        ? read.promise.then(() => fail(config, 500)) : ok(config, journey([liveAttempt()]));
      if (config.url === "/me/assessments") return ok(config, assessmentPage());
      throw new Error(`Unexpected request: ${config.url}`);
    });
    mountAssessmentApp("/my-learning");
    await screen.findByText("German Basics");
    expect(screen.getByText("Checking assessment attempts...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue Learning" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
    await act(async () => { read.resolve(); });
    await screen.findByText("Unable to load active assessments.");
    expect(screen.getByRole("button", { name: "Continue Learning" })).toBeEnabled();
    failed = false;
    await user.click(screen.getByRole("button", { name: "Retry active assessments" }));
    await screen.findByRole("link", { name: "Continue assessment" });
    expect(http.mock.calls.filter(([config]) => config.url === "/me/courses")).toHaveLength(1);
    await user.click(screen.getByRole("link", { name: "Explore available assessments" }));
    await screen.findByRole("link", { name: "View assessment" });
  });

  it("keeps active resumes useful independently of a failed Course read", async () => {
    assessmentHttp((config) => config.url === journeyUrl ? ok(config, journey([liveAttempt()])) : fail(config, 500));
    mountAssessmentApp("/my-learning");
    await screen.findByText("Something went wrong");
    expect(await screen.findByRole("link", { name: "Continue assessment" })).toHaveAttribute("href", attemptPath);
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
  });

  it("rejects malformed Journey snapshots without partial active cards", async () => {
    assessmentHttp((config) => ok(config, config.url === journeyUrl
      ? journey([liveAttempt(), liveAttempt({ assessmentId: " " })]) : courses));
    mountAssessmentApp("/my-learning");
    await screen.findByText("Unable to load active assessments.");
    expect(screen.getByText("German Basics")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue assessment" })).not.toBeInTheDocument();
  });
});
