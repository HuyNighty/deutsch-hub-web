import { describe, it, expect } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { emptyJourneyHttp as assessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { assessmentPage } from "@/features/assessment/test/fixtures";

describe("My Learning Assessment entry", () => {
  it.each([false, true])("keeps discovery reachable with empty Courses: %s", async (empty) => {
    const user = userEvent.setup();
    const courses = empty ? [] : [{
      // Leave the existing Course key behavior outside this slice.
      id: "course-id", courseId: "course-id", title: "German Basics",
      completedLessons: 0, totalLessons: 10, completionPercentage: 0,
    }];
    const http = assessmentHttp((config) => {
      if (config.url === "/me/courses") return ok(config, courses);
      if (config.url === "/me/assessments") return ok(config, assessmentPage());
      throw new Error(`Unexpected request: ${config.url}`);
    });
    const { router } = mountAssessmentApp("/my-learning");
    await screen.findByText(empty ? "No courses yet" : "German Basics");
    expect(screen.getByRole("heading", { name: "Assessments" })).toBeInTheDocument();
    const entry = screen.getByRole("link", { name: "Explore available assessments" });
    expect(entry).toHaveAttribute("href", "/my-learning/assessments");
    if (empty) expect(screen.getByText("Start learning your first course.")).toBeInTheDocument();
    else expect(screen.getByRole("button", { name: "Continue Learning" })).toBeInTheDocument();
    await user.click(entry);
    await screen.findByRole("link", { name: "View assessment" });
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual(
      ["/me/courses", "/me/learning-journey", "/me/assessments"].sort(),
    );
  });

  it("retains the entry while the Course list is loading and when that read fails", async () => {
    const response = deferred();
    const started = deferred();
    assessmentHttp((config) => {
      started.resolve();
      return response.promise.then(() => fail(config, 500));
    });
    mountAssessmentApp("/my-learning");
    await act(async () => { await started.promise; });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
    await act(async () => { response.resolve(); });
    await screen.findByText("Something went wrong");
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available assessments" })).toBeInTheDocument();
  });
});
