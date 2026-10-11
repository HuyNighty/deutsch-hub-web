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
    expect(screen.getByText("Trình độ mục tiêu: B1")).toBeInTheDocument();
    expect(screen.getByText("Giới hạn thời gian: 60 phút")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem bài đánh giá" })).toHaveAttribute(
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
    expect(screen.getByText("Đang tải...")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Xem bài đánh giá" })).not.toBeInTheDocument();
    await act(async () => { response.resolve(); });
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
  });

  it("shows empty copy without Page 1 of 0 or pagination controls", async () => {
    assessmentHttp((config) => ok(config, assessmentPage({ items: [], totalElements: 0, totalPages: 0 })));
    mountAssessmentApp("/my-learning/assessments");
    await screen.findByText("Chưa có bài đánh giá");
    expect(screen.getByText("Hiện chưa có bài đánh giá đang hoạt động.")).toBeInTheDocument();
    expect(screen.queryByText(/Trang 1 \/ 0/)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Các trang bài đánh giá" })).not.toBeInTheDocument();
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
    await screen.findByText("Trang 1 / 2");
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Trang tiếp" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Trang tiếp" }));
    await screen.findByRole("heading", { name: "Second assessment" });
    expect(screen.getByText("Trang 2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Trang tiếp" })).toBeDisabled();
    expect(http.mock.calls.map(([config]) => config.params)).toEqual([{ page: 0, size: 20 }, { page: 1, size: 20 }]);
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toEqual(first);
    expect(client.getQueryData(["learner-assessments", { page: 1, size: 20 }])).toEqual(second);
    await user.click(screen.getByRole("button", { name: "Trang trước" }));
    await screen.findByText("Trang 1 / 2");
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
  });

  it("presents historical null title and time limit with learner-safe fallback labels", async () => {
    assessmentHttp((config) => ok(config, assessmentPage({ items: [summary({ title: null, timeLimitMinutes: null })] })));
    mountAssessmentApp("/my-learning/assessments");
    await screen.findByRole("heading", { name: "Bài đánh giá chưa có tên" });
    expect(screen.getByText("Giới hạn thời gian: Không giới hạn thời gian")).toBeInTheDocument();
    expect(screen.getByText("Trình độ mục tiêu: B1")).toBeInTheDocument();
  });

  it.each([
    ["invalid page", () => assessmentPage({ page: -1 })],
    ["inactive item", () => assessmentPage({ items: [summary(), summary({ assessmentId: "bad", status: "DRAFT" })] })],
    ["blank title", () => assessmentPage({ items: [summary(), summary({ assessmentId: "bad", title: " " })] })],
  ])("rejects malformed 200 with %s without rendering partial data", async (_, invalid) => {
    assessmentHttp((config) => ok(config, invalid()));
    const { client } = mountAssessmentApp("/my-learning/assessments");
    await screen.findByText("Đã xảy ra lỗi");
    expect(screen.queryByRole("heading", { name: "B1 Placement Assessment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Xem bài đánh giá" })).not.toBeInTheDocument();
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toBeUndefined();
  });

  it("uses existing error and retry behavior for an HTTP failure", async () => {
    const user = userEvent.setup();
    let failed = true;
    const http = assessmentHttp((config) => failed ? fail(config, 500) : ok(config, assessmentPage()));
    mountAssessmentApp("/my-learning/assessments");
    await screen.findByText("Đã xảy ra lỗi");
    failed = false;
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    expect(http).toHaveBeenCalledTimes(2);
  });

  it("opens real Detail from the catalog without patching its independent catalog cache", async () => {
    const user = userEvent.setup();
    const page = assessmentPage();
    assessmentHttp((config) => ok(config, config.url === "/me/assessments" ? page : assessmentDetail()));
    const { client, router } = mountAssessmentApp("/my-learning/assessments");
    await user.click(await screen.findByRole("link", { name: "Xem bài đánh giá" }));
    await screen.findByRole("heading", { name: "Viết" });
    expect(router.state.location.pathname).toBe(`/my-learning/assessments/${ASSESSMENT_ID}`);
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toEqual(page);
    expect(client.getQueryData(["learner-assessment", ASSESSMENT_ID])).toEqual(assessmentDetail());
    const detail = screen.getByRole("region", { name: "Chi tiết bài đánh giá" });
    expect(await within(detail).findByRole("button", { name: "Bắt đầu bài đánh giá" })).toBeInTheDocument();
  });
});
