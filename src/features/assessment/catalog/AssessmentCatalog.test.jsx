import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ok, fail, deferred } from "@/test/http";
import { assessmentPage, summary, ASSESSMENT_ID, assessmentDetail } from "../test/fixtures";
import { emptyJourneyHttp as assessmentHttp, mountAssessmentApp } from "../test/assessment-app";

describe("learner Assessment catalog", () => {
  it("uses the protected production route, exact v1 read and canonical key with complete metadata", async () => {
    const page = assessmentPage();
    const http = assessmentHttp((config) => ok(config, page));
    const { client } = mountAssessmentApp("/my-learning/assessments");
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({
      method: "get", url: "/me/assessments", params: { page: 0, size: 20 },
    });
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toEqual(page);
    expect(screen.getByText("Target level: B1")).toBeInTheDocument();
    expect(screen.getByText("Time limit: 60 minutes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View assessment" })).toHaveAttribute(
      "href", `/my-learning/assessments/${ASSESSMENT_ID}`,
    );
    expect(screen.queryByText(ASSESSMENT_ID)).not.toBeInTheDocument();
  });

  it("shows a loading state until the catalog read completes", async () => {
    const response = deferred();
    const started = deferred();
    assessmentHttp((config) => {
      started.resolve();
      return response.promise.then(() => ok(config, assessmentPage()));
    });
    mountAssessmentApp("/my-learning/assessments");
    await act(async () => { await started.promise; });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View assessment" })).not.toBeInTheDocument();
    await act(async () => { response.resolve(); });
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
  });

  it("shows empty copy without Page 1 of 0 or pagination controls", async () => {
    assessmentHttp((config) => ok(config, assessmentPage({ items: [], totalElements: 0, totalPages: 0 })));
    mountAssessmentApp("/my-learning/assessments");
    await screen.findByText("No assessments available");
    expect(screen.getByText("There are no active assessments available right now.")).toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of 0/)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Assessment pages" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create|admin/i })).not.toBeInTheDocument();
  });

  it("paginates with server metadata and independent page-specific query keys", async () => {
    const user = userEvent.setup();
    const first = assessmentPage({ totalElements: 21, totalPages: 2 });
    const second = assessmentPage({
      items: [summary({ assessmentId: "page-two-id", title: "Second assessment" })],
      page: 1, totalElements: 21, totalPages: 2,
    });
    const http = assessmentHttp((config) => ok(config, config.params.page === 0 ? first : second));
    const { client } = mountAssessmentApp("/my-learning/assessments");
    await screen.findByText("Page 1 of 2");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("heading", { name: "Second assessment" });
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(http.mock.calls.map(([config]) => config.params)).toEqual([{ page: 0, size: 20 }, { page: 1, size: 20 }]);
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toEqual(first);
    expect(client.getQueryData(["learner-assessments", { page: 1, size: 20 }])).toEqual(second);
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByText("Page 1 of 2");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("presents historical null title and time limit with learner-safe fallback labels", async () => {
    assessmentHttp((config) => ok(config, assessmentPage({ items: [summary({ title: null, timeLimitMinutes: null })] })));
    mountAssessmentApp("/my-learning/assessments");
    await screen.findByRole("heading", { name: "Untitled assessment" });
    expect(screen.getByText("Time limit: No time limit")).toBeInTheDocument();
    expect(screen.getByText("Target level: B1")).toBeInTheDocument();
  });

  it.each([
    ["invalid page", () => assessmentPage({ page: -1 })],
    ["inactive item", () => assessmentPage({ items: [summary(), summary({ assessmentId: "bad", status: "DRAFT" })] })],
    ["blank title", () => assessmentPage({ items: [summary(), summary({ assessmentId: "bad", title: " " })] })],
  ])("rejects malformed 200 with %s without rendering partial data", async (_, invalid) => {
    assessmentHttp((config) => ok(config, invalid()));
    const { client } = mountAssessmentApp("/my-learning/assessments");
    await screen.findByText("Something went wrong");
    expect(screen.queryByRole("heading", { name: "B1 Placement Assessment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View assessment" })).not.toBeInTheDocument();
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toBeUndefined();
  });

  it("uses existing error and retry behavior for an HTTP failure", async () => {
    const user = userEvent.setup();
    let failed = true;
    const http = assessmentHttp((config) => failed ? fail(config, 500) : ok(config, assessmentPage()));
    mountAssessmentApp("/my-learning/assessments");
    await screen.findByText("Something went wrong");
    failed = false;
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    expect(http).toHaveBeenCalledTimes(2);
  });

  it("opens real Detail from the catalog without patching its independent catalog cache", async () => {
    const user = userEvent.setup();
    const page = assessmentPage();
    assessmentHttp((config) => ok(config, config.url === "/me/assessments" ? page : assessmentDetail()));
    const { client, router } = mountAssessmentApp("/my-learning/assessments");
    await user.click(await screen.findByRole("link", { name: "View assessment" }));
    await screen.findByRole("heading", { name: "Writing" });
    expect(router.state.location.pathname).toBe(`/my-learning/assessments/${ASSESSMENT_ID}`);
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toEqual(page);
    expect(client.getQueryData(["learner-assessment", ASSESSMENT_ID])).toEqual(assessmentDetail());
    const detail = screen.getByRole("region", { name: "Assessment detail" });
    expect(await within(detail).findByRole("button", { name: "Start Assessment" })).toBeInTheDocument();
  });
});
