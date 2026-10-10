import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { journey, journeyUrl, courseSnapshot, liveAttempt } from "@/features/assessment/test/attempt-fixtures";
import { directionUrl, discoverDirection } from "@/test/direction-fixtures";
import { nextActivityUrl, noActivity } from "@/test/next-activity-fixtures";
import { nextActivityKey, nextActivityOptions } from "./hooks/useNextActivity";
import { getNextActivity } from "./next-activity.service";

const guidance = () => within(screen.getByRole("region", { name: "Hướng dẫn học tập" }));
const requests = (http) => http.mock.calls.map(([config]) => [config.method, config.url, config.data]).sort();
const expected = (...urls) => urls.map((url) => ["get", url, undefined]).sort();
const coldReads = [journeyUrl, directionUrl, nextActivityUrl];
const differentDirection = { type: "CONTINUE_COURSE", target: { courseId: "different-course" } };
const lesson = { type: "OPEN_LESSON", target: { courseId: "course /?#", lessonId: "lesson /?#" } };
const task = { type: "RESUME_ASSESSMENT_TASK", target: {
  assessmentAttemptId: "attempt /?#", taskId: "task /?#", quizAttemptId: "quiz-must-not-be-in-route",
} };
const assessment = { type: "OPEN_ASSESSMENT", target: { assessmentAttemptId: "attempt /?#" } };

function guidanceHttp(activity, direction = differentDirection, snapshot = journey([liveAttempt()], {
  currentLevel: "B2", courses: [courseSnapshot()],
})) {
  return assessmentHttp((config) => {
    const value = config.url === nextActivityUrl ? activity
      : config.url === directionUrl ? direction
      : config.url === journeyUrl ? snapshot : undefined;
    if (value === undefined) throw new Error("No guidance enrichment: " + config.url);
    return typeof value === "function" ? value(config) : ok(config, value);
  });
}

function expectJourney() {
  expect(screen.getByText("German Basics")).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Trình độ tiếng Đức hiện tại" })).getByText("B2")).toBeVisible();
  expect(screen.getByRole("region", { name: "Bài đánh giá đang thực hiện" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Khám phá bài đánh giá" })).toBeVisible();
}

describe("Learning Guidance concrete activity refinement", () => {
  it.each([
    [lesson, "Tiếp tục với bài học tiếp theo của bạn.", "Mở bài học tiếp theo", "/my-learning/courses/course%20%2F%3F%23/lessons/lesson%20%2F%3F%23"],
    [task, "Tiếp tục bài tập đánh giá đang thực hiện.", "Tiếp tục bài tập", "/my-learning/assessment-attempts/attempt%20%2F%3F%23/tasks/task%20%2F%3F%23"],
    [assessment, "Quay lại bài đánh giá để tiếp tục.", "Xem bài đánh giá", "/my-learning/assessment-attempts/attempt%20%2F%3F%23"],
  ])("renders canonical %j despite different Direction/Journey, with one CTA and no enrichment", async (activity, text, label, href) => {
    const http = guidanceHttp(activity);
    const { client, router } = mountAssessmentApp("/my-learning");
    await guidance().findByRole("link", { name: label });
    await screen.findByText("German Basics");
    expect(guidance().getByRole("heading", { name: "Hướng dẫn học tập" })).toBeVisible();
    expect(guidance().getByText(text)).toBeVisible();
    expect(guidance().getAllByRole("link")).toHaveLength(1);
    const link = guidance().getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", href);
    expect(link.getAttribute("href")).not.toContain(task.target.quizAttemptId);
    expect(link.getAttribute("href")).not.toContain(differentDirection.target.courseId);
    expect(guidance().queryByRole("link", { name: "Tiếp tục học" })).not.toBeInTheDocument();
    expect(client.getQueryData(nextActivityKey)).toEqual(activity);
    expect(nextActivityOptions).toMatchObject({ queryKey: nextActivityKey, queryFn: getNextActivity, retry: false });
    expect(router.state.location.pathname).toBe("/my-learning");
    expectJourney();
    expect(requests(http)).toEqual(expected(...coldReads));
  });

  it.each([
    [{ type: "RESUME_ASSESSMENT", target: { assessmentAttemptId: "coarse-attempt" } }, "Tiếp tục đánh giá"],
    [differentDirection, "Tiếp tục học"],
    [discoverDirection, "Khám phá khóa học"],
  ])("uses Direction %j as NONE fallback without completion inference", async (direction, label) => {
    const http = guidanceHttp(noActivity, direction);
    mountAssessmentApp("/my-learning");
    await guidance().findByRole("link", { name: label });
    expect(guidance().getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Hướng dẫn học tập" }).textContent)
      .not.toMatch(/NONE|complete|nothing left|no work|no recommendation|hoàn thành|không còn|không có việc|không có khuyến nghị/i);
    expect(requests(http)).toEqual(expected(...coldReads));
  });

  it("keeps Direction usable while Next Activity is pending", async () => {
    const gate = deferred();
    const http = guidanceHttp((config) => gate.promise.then(() => ok(config, lesson)));
    mountAssessmentApp("/my-learning");
    expect(await guidance().findByRole("link", { name: "Tiếp tục học" })).toBeVisible();
    expect(guidance().queryByText("Đang tải hướng dẫn học tập...")).not.toBeInTheDocument();
    expect(requests(http)).toEqual(expected(...coldReads));
    await act(async () => { gate.resolve(); });
    await guidance().findByRole("link", { name: "Mở bài học tiếp theo" });
    expect(guidance().getAllByRole("link")).toHaveLength(1);
    expect(guidance().queryByRole("link", { name: "Tiếp tục học" })).not.toBeInTheDocument();
  });

  it("reads all three resources independently while neither guidance resource has usable data", async () => {
    const activityGate = deferred();
    const directionGate = deferred();
    const http = guidanceHttp(
      (config) => activityGate.promise.then(() => ok(config, lesson)),
      (config) => directionGate.promise.then(() => ok(config, differentDirection)),
    );
    mountAssessmentApp("/my-learning");
    await screen.findByText("German Basics");
    expect(guidance().getByText("Đang tải hướng dẫn học tập...")).toBeVisible();
    expectJourney();
    expect(requests(http)).toEqual(expected(...coldReads));
    await act(async () => { activityGate.resolve(); });
    expect(await guidance().findByRole("link", { name: "Mở bài học tiếp theo" })).toBeVisible();
    await act(async () => { directionGate.resolve(); });
    expect(guidance().getAllByRole("link")).toHaveLength(1);
  });

  it("retains Direction on Activity failure and retries only Next Activity", async () => {
    let failed = true;
    const http = guidanceHttp((config) => failed ? fail(config, 500) : ok(config, lesson));
    mountAssessmentApp("/my-learning");
    const recovery = await screen.findByRole("region", { name: "Hoạt động tiếp theo" });
    expect(await guidance().findByRole("link", { name: "Tiếp tục học" })).toBeVisible();
    await screen.findByText("German Basics");
    expectJourney();
    expect(requests(http)).toEqual(expected(...coldReads));
    failed = false;
    await userEvent.setup().click(within(recovery).getByRole("button", { name: "Thử lại" }));
    await guidance().findByRole("link", { name: "Mở bài học tiếp theo" });
    expect(guidance().getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Hoạt động tiếp theo" })).not.toBeInTheDocument();
    expect(requests(http)).toEqual(expected(...coldReads, nextActivityUrl));
  });

  it("keeps actionable Activity usable when Direction fails", async () => {
    const http = guidanceHttp(task, (config) => fail(config, 500));
    mountAssessmentApp("/my-learning");
    expect(await guidance().findByRole("link", { name: "Tiếp tục bài tập" })).toBeVisible();
    await screen.findByText("German Basics");
    expect(guidance().getAllByRole("link")).toHaveLength(1);
    expectJourney();
    expect(requests(http)).toEqual(expected(...coldReads));
  });

  it("keeps actionable Activity usable when Journey fails", async () => {
    const http = guidanceHttp(assessment, differentDirection, (config) => fail(config, 500));
    mountAssessmentApp("/my-learning");
    expect(await guidance().findByRole("link", { name: "Xem bài đánh giá" })).toBeVisible();
    await screen.findByRole("button", { name: "Thử lại" });
    expect(guidance().queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(requests(http)).toEqual(expected(...coldReads));
  });

  it("rejects malformed 2xx Activity with focused recovery, Direction fallback and no guessed navigation", async () => {
    const http = guidanceHttp({ type: "RESUME_ASSESSMENT_TASK", target: { assessmentAttemptId: "attempt", taskId: "task" } });
    const { client, router } = mountAssessmentApp("/my-learning");
    await screen.findByRole("region", { name: "Hoạt động tiếp theo" });
    expect(await guidance().findByRole("link", { name: "Tiếp tục học" })).toBeVisible();
    await screen.findByText("German Basics");
    expect(client.getQueryState(nextActivityKey).error.message).toBe("The server returned an invalid next activity response.");
    expect(guidance().getAllByRole("link")).toHaveLength(1);
    expect(router.state.location.pathname).toBe("/my-learning");
    expectJourney();
    expect(requests(http)).toEqual(expected(...coldReads));
  });

  it("provides separate retry boundaries when both guidance resources fail", async () => {
    let directionFailed = true;
    let activityFailed = true;
    const http = guidanceHttp(
      (config) => activityFailed ? fail(config, 500) : ok(config, lesson),
      (config) => directionFailed ? fail(config, 500) : ok(config, differentDirection),
    );
    mountAssessmentApp("/my-learning");
    const coarseRecovery = await screen.findByRole("region", { name: "Hướng học tập" });
    await screen.findByRole("region", { name: "Hoạt động tiếp theo" });
    expect(guidance().queryByRole("link")).not.toBeInTheDocument();
    directionFailed = false;
    await userEvent.setup().click(within(coarseRecovery).getByRole("button", { name: "Thử lại" }));
    await guidance().findByRole("link", { name: "Tiếp tục học" });
    expect(requests(http)).toEqual(expected(...coldReads, directionUrl));
    activityFailed = false;
    await userEvent.setup().click(within(screen.getByRole("region", { name: "Hoạt động tiếp theo" })).getByRole("button", { name: "Thử lại" }));
    await guidance().findByRole("link", { name: "Mở bài học tiếp theo" });
    expect(requests(http)).toEqual(expected(...coldReads, directionUrl, nextActivityUrl));
  });
});
