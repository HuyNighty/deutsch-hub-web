import { describe, it, expect } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";

const courseId = "enrolled-course-original";
const path = `/my-learning/courses/${courseId}`;
const url = `/me/courses/${courseId}`;
const detail = (status = "IN_PROGRESS") => ({
  id: courseId, title: "Deutsch A1 — Grüße", description: "Authored description: Guten Tag!", level: "A1",
  enrollmentStatus: status, completionPercentage: 73.25, completedLessons: 3, totalLessons: 8, totalStudyMinutes: 90.5,
  sections: [
    { id: "section-z", title: "Begrüßung", description: "Guten Morgen.", orderIndex: 2, lessons: [
      { id: "lesson-z", title: "Auf Wiedersehen", description: "Authored lesson: Abschied.", orderIndex: 2, estimatedMinutes: 17 },
      { id: "lesson-a", title: "Guten Tag", description: "Authored lesson: Grüße.", orderIndex: 1, estimatedMinutes: 8 },
    ] },
    { id: "section-a", title: "Gespräche", description: "Wie geht es dir?", orderIndex: 1, lessons: [
      { id: "lesson-next", title: "Hallo", description: "Authored lesson: Dialog.", estimatedMinutes: 12 },
    ] },
  ],
});
const requests = (http) => http.mock.calls.map(([config]) => [config.method, config.url, config.data]);
const readOnlyOptions = { allowCourseDetailReads: true, allowLessonReads: true };

describe("My Course Detail Vietnamese presentation", () => {
  it.each([
    ["ENROLLED", "Đã đăng ký"], ["IN_PROGRESS", "Đang học"], ["COMPLETED", "Đã hoàn thành khóa học"],
  ])("preserves canonical progress and authored order with enrollment status %s", async (status, label) => {
    const value = detail(status);
    const http = assessmentHttp(config => {
      expect(config.url).toBe(url);
      return ok(config, value);
    }, readOnlyOptions);
    const { client, router } = mountAssessmentApp(path);
    const heading = await screen.findByRole("heading", { name: value.title, level: 1 });
    const page = heading.closest("main");
    expect(page).toHaveAttribute("lang", "vi");
    expect(screen.getByText(value.description)).toBeVisible();
    const progress = screen.getByRole("heading", { name: "Tiến độ khóa học", level: 2 }).closest("section");
    const stats = within(progress);
    expect(stats.getByText("Tiến độ", { exact: true })).toBeVisible();
    expect(stats.getByText("73.25%")).toBeVisible();
    expect(progress.querySelector('[class*="progress-fill"]')).toHaveStyle({ width: "73.25%" });
    expect(stats.getByText("Bài học", { exact: true })).toBeVisible();
    expect(stats.getByText("3/8")).toBeVisible();
    expect(stats.getByText("Thời gian học đã ghi nhận")).toBeVisible();
    expect(stats.getByText("90.5 phút")).toBeVisible();
    expect(stats.getByText("Trạng thái")).toBeVisible();
    expect(stats.getByText(label, { exact: true })).toBeVisible();
    const curriculum = screen.getByRole("heading", { name: "Nội dung khóa học" }).closest("section");
    expect(within(curriculum).getAllByRole("heading", { level: 3 }).map(h => h.textContent))
      .toEqual(value.sections.map(s => s.title));
    const lessons = value.sections.flatMap(s => s.lessons);
    expect(within(curriculum).getAllByRole("heading", { level: 4 }).map(h => h.textContent)).toEqual(lessons.map(l => l.title));
    expect(within(curriculum).getAllByRole("link").map(a => a.getAttribute("href")))
      .toEqual(lessons.map(l => `${path}/lessons/${l.id}`));
    for (const section of value.sections) expect(within(curriculum).getByText(section.description)).toBeVisible();
    for (const lesson of lessons) {
      expect(within(curriculum).getByText(lesson.description)).toBeVisible();
      expect(within(curriculum).getByText(`${lesson.estimatedMinutes} phút`)).toBeVisible();
    }
    expect(within(curriculum).queryByRole("button")).not.toBeInTheDocument();
    expect(page.textContent).not.toMatch(/thành thạo|đạt trình độ|nâng trình độ|năng lực|xem video|AI|Learning Progress|Study Time/);
    expect(client.getQueryData(["my-courses", courseId])).toEqual(value);
    expect(router.state.location.pathname).toBe(path);
    expect(requests(http)).toEqual([["get", url, undefined]]);
  });

  it("opens the existing lesson route by original IDs only after a learner click", async () => {
    const user = userEvent.setup();
    const lesson = { id: "lesson-z", title: "Auf Wiedersehen", description: "Authored lesson: Abschied.",
      estimatedMinutes: 17, orderIndex: 2, level: "A1", items: [], completed: false, previousLessonId: null, nextLessonId: null };
    const lessonUrl = `${url}/lessons/${lesson.id}`;
    const http = assessmentHttp(config => {
      if (config.url === url) return ok(config, detail());
      if (config.url === lessonUrl) return ok(config, lesson);
      throw new Error("Unexpected My Course request: " + config.url);
    }, readOnlyOptions);
    const { router } = mountAssessmentApp(path);
    await screen.findByRole("heading", { name: "Tiến độ khóa học" });
    expect(requests(http)).toEqual([["get", url, undefined]]);
    await user.click(screen.getByRole("link", { name: /Auf Wiedersehen/ }));
    await screen.findByRole("heading", { name: lesson.title, level: 1 });
    expect(router.state.location.pathname).toBe(`${path}/lessons/${lesson.id}`);
    expect(requests(http)).toEqual([["get", url, undefined], ["get", lessonUrl, undefined]]);
  });

  it("retains loading, isolated error and explicit Course retry without mutations", async () => {
    const user = userEvent.setup();
    const gate = deferred();
    let failed = true;
    const http = assessmentHttp(async config => {
      expect(config.url).toBe(url);
      if (failed) { await gate.promise; return fail(config, 500); }
      return ok(config, detail());
    }, readOnlyOptions);
    mountAssessmentApp(path);
    expect(screen.getByText("Đang tải...")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Tiến độ khóa học" })).not.toBeInTheDocument();
    await act(async () => { gate.resolve(); });
    await screen.findByRole("button", { name: "Thử lại" });
    expect(screen.queryByRole("heading", { name: "Tiến độ khóa học" })).not.toBeInTheDocument();
    failed = false;
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByRole("heading", { name: "Tiến độ khóa học" });
    expect(requests(http)).toEqual([["get", url, undefined], ["get", url, undefined]]);
  });

  it("preserves protected-route login and returnTo without a Course request for anonymous access", async () => {
    const http = assessmentHttp(() => { throw new Error("Anonymous Course request"); }, readOnlyOptions);
    const { router } = mountAssessmentApp(path, { anonymous: true });
    await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: path });
    expect(screen.queryByText("90.5 phút")).not.toBeInTheDocument();
    expect(http).not.toHaveBeenCalled();
  });
});
