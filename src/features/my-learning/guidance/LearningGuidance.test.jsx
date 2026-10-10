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
const guidance = () => within(screen.getByRole("region", { name: "Hướng dẫn học tập" }));
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
  expect(within(screen.getByRole("region", { name: "Trình độ tiếng Đức hiện tại" })).getByText("B2")).toBeVisible();
  expect(screen.getByRole("region", { name: "Bài đánh giá đang thực hiện" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Khám phá bài đánh giá" })).toBeVisible();
}

describe("Learning Guidance independent resource", () => {
  it.each([
    [{ type: "RESUME_ASSESSMENT", target: { assessmentAttemptId: "absent /?#" } }, "Bạn đang thực hiện một bài đánh giá.", "Tiếp tục đánh giá", "/my-learning/assessment-attempts/absent%20%2F%3F%23"],
    [{ type: "CONTINUE_COURSE", target: { courseId: "absent /?#" } }, "Tiếp tục khóa học bạn đang học.", "Tiếp tục học", "/my-learning/courses/absent%20%2F%3F%23"],
    [discoverDirection, "Chọn một khóa học để bắt đầu hoặc tiếp tục học tiếng Đức.", "Khám phá khóa học", "/learn-german"],
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
    const page = screen.getByRole("heading", { name: "Học tập của tôi", level: 1 }).closest("main");
    const sections = [...page.children];
    expect(sections.indexOf(screen.getByRole("region", { name: "Hướng dẫn học tập" })))
      .toBeLessThan(sections.indexOf(screen.getByRole("region", { name: "Bài đánh giá" })));
    expect(page.textContent).not.toMatch(/next activity|next step|recommended|do this now|AI recommendation|hoạt động tiếp theo|bước tiếp theo|khuyến nghị|làm ngay|AI|tối ưu/i);
  });

  it("keeps Journey and discovery usable while Direction is pending", async () => {
    const gate = deferred();
    const http = readHttp((config) => gate.promise.then(() => ok(config, discoverDirection)));
    mountAssessmentApp("/my-learning");
    await screen.findByText("German Basics");
    expect(guidance().getByText("Đang tải hướng dẫn học tập...")).toBeVisible();
    expectJourney();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
    await act(async () => { gate.resolve(); });
    expect(await guidance().findByRole("link", { name: "Khám phá khóa học" })).toBeVisible();
  });

  it("isolates Direction failure and retries only Direction while retaining Journey", async () => {
    let failed = true;
    const http = readHttp((config) => failed ? fail(config, 500) : ok(config, discoverDirection));
    mountAssessmentApp("/my-learning");
    await guidance().findByRole("button", { name: "Thử lại" });
    await screen.findByText("German Basics");
    expectJourney();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
    failed = false;
    await userEvent.setup().click(guidance().getByRole("button", { name: "Thử lại" }));
    await guidance().findByRole("link", { name: "Khám phá khóa học" });
    expectJourney();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl, directionUrl));
  });

  it("keeps Direction actionable when Journey fails", async () => {
    const http = readHttp(discoverDirection, (config) => fail(config, 500));
    mountAssessmentApp("/my-learning");
    expect(await guidance().findByRole("link", { name: "Khám phá khóa học" })).toBeVisible();
    await screen.findByRole("button", { name: "Thử lại" });
    expect(guidance().queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Khám phá bài đánh giá" })).toBeVisible();
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
  });

  it("rejects malformed 2xx Direction without Journey fallback, collapse or navigation", async () => {
    const http = readHttp({ type: "RESUME_ASSESSMENT", target: { courseId: "wrong" } });
    const { router, client } = mountAssessmentApp("/my-learning");
    await guidance().findByRole("button", { name: "Thử lại" });
    await screen.findByText("German Basics");
    expectJourney();
    expect(guidance().queryByRole("link")).not.toBeInTheDocument();
    expect(client.getQueryState(learningDirectionKey).error.message).toBe("The server returned an invalid learning direction response.");
    expect(router.state.location.pathname).toBe("/my-learning");
    expect(requests(http)).toEqual(expected(journeyUrl, nextActivityUrl, directionUrl));
  });
});
