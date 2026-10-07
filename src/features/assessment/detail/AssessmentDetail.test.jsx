import { describe, it, expect } from "vitest";
import { act, screen, within, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentPage, assessmentDetail, ASSESSMENT_ID } from "../test/fixtures";
import { emptyJourneyHttp as assessmentHttp, mountAssessmentApp } from "../test/assessment-app";
import { useLearnerAssessment } from "./hooks/useLearnerAssessment";

describe("learner Assessment detail", () => {
  it("uses the exact v1 endpoint, canonical key and human-readable ordered structure without technical IDs or enrichment", async () => {
    const detail = assessmentDetail();
    const http = assessmentHttp((config) => ok(config, detail));
    const { client } = mountAssessmentApp(`/my-learning/assessments/${ASSESSMENT_ID}`);
    await screen.findByRole("heading", { name: detail.title });
    await screen.findByRole("button", { name: "Start Assessment" });
    expect(http).toHaveBeenCalledTimes(2);
    expect(http.mock.calls[0][0]).toMatchObject({ method: "get", url: `/me/assessments/${ASSESSMENT_ID}` });
    expect(client.getQueryData(["learner-assessment", ASSESSMENT_ID])).toEqual(detail);
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toBeUndefined();
    expect(screen.getByText("Target level: B1")).toBeInTheDocument();
    expect(screen.getByText("Time limit: 60 minutes")).toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Assessment detail" });
    const headings = within(region).getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["Writing", "Listening", "Reading", "Speaking"]);
    expect(within(headings[0].closest("section")).getByText("Execution mode: Independent")).toBeInTheDocument();
    expect(within(headings[1].closest("section")).getByText("Execution mode: Sequential")).toBeInTheDocument();
    expect(within(region).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["Task 4", "Task 2", "Task 1", "Task 3", "Task 5"]);
    const identities = [detail.assessmentId, ...detail.components.flatMap((component) => [
      component.componentId, ...component.tasks.flatMap((task) => [task.taskId, task.quizRevisionId]),
    ])];
    for (const identity of identities) expect(region.textContent).not.toContain(identity);
    expect(within(region).getByRole("button", { name: "Start Assessment" })).toBeInTheDocument();
    expect(region.textContent).not.toMatch(/recommended|too difficult|unlocked|locked|ready|coming soon/i);
  });

  it("supports loading and historical null labels", async () => {
    const response = deferred();
    const started = deferred();
    assessmentHttp((config) => {
      started.resolve();
      return response.promise.then(() => ok(config, assessmentDetail({ title: null, timeLimitMinutes: null })));
    });
    mountAssessmentApp(`/my-learning/assessments/${ASSESSMENT_ID}`);
    await act(async () => { await started.promise; });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => { response.resolve(); });
    await screen.findByRole("heading", { name: "Untitled assessment" });
    expect(screen.getByText("Time limit: No time limit")).toBeInTheDocument();
  });

  it("renders the existing not-found state for Backend 404 with a working catalog action", async () => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => config.url === "/me/assessments"
      ? ok(config, assessmentPage()) : fail(config, 404));
    const { router } = mountAssessmentApp(`/my-learning/assessments/${ASSESSMENT_ID}`);
    await screen.findByText("Resource Not Found");
    const link = screen.getByRole("link", { name: "Browse assessments" });
    expect(link).toHaveAttribute("href", "/my-learning/assessments");
    await user.click(link);
    await screen.findByRole("link", { name: "View assessment" });
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([
      `/me/assessments/${ASSESSMENT_ID}`, "/me/assessments",
    ]);
  });

  it.each([
    ["skill", (detail) => { detail.components[0].skillDimension = "GRAMMAR"; }],
    ["execution mode", (detail) => { detail.components[0].executionMode = "PARALLEL"; }],
    ["task order", (detail) => { detail.components[0].tasks[0].order = 0; }],
  ])("rejects malformed successful detail %s as an error without rendering partial structure", async (_, invalidate) => {
    const detail = assessmentDetail();
    invalidate(detail);
    assessmentHttp((config) => ok(config, detail));
    const { client } = mountAssessmentApp(`/my-learning/assessments/${ASSESSMENT_ID}`);
    await screen.findByText("Something went wrong");
    expect(screen.queryByRole("heading", { name: "B1 Placement Assessment" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Task \d/)).not.toBeInTheDocument();
    expect(client.getQueryData(["learner-assessment", ASSESSMENT_ID])).toBeUndefined();
  });

  it("uses the real back link to return to the catalog", async () => {
    const user = userEvent.setup();
    assessmentHttp((config) => ok(config, config.url === "/me/assessments" ? assessmentPage() : assessmentDetail()));
    const { router } = mountAssessmentApp(`/my-learning/assessments/${ASSESSMENT_ID}`);
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    await user.click(screen.getByRole("link", { name: "Back to Assessments" }));
    await screen.findByRole("link", { name: "View assessment" });
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
  });

  it("does not run its query without an assessment ID", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const http = assessmentHttp(() => { throw new Error("No request should run"); });
    function Wrapper({ children }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }
    const { result } = renderHook(() => useLearnerAssessment(undefined), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(http).not.toHaveBeenCalled();
  });
});
