import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { ok, setHttpHandler } from "@/test/http";
import LessonDetail from "./index";

const courseId = "text-course";
const lessons = [
  { id: "first", title: "First lesson", content: "<p>Hallo <strong>zusammen</strong>.</p>" },
  { id: "second", title: "Second lesson", content: '<p onclick="alert(1)">Persisted lesson.</p><script>alert(1)</script><iframe src="javascript:alert(1)"></iframe>' },
  { id: "third", title: "Third lesson", content: "Auf Wiedersehen." },
].map((lesson, index, source) => ({
  ...lesson,
  level: "A1",
  description: "Learn everyday German.",
  orderIndex: index + 1,
  estimatedMinutes: 10,
  completed: false,
  previousLessonId: source[index - 1]?.id ?? null,
  nextLessonId: source[index + 1]?.id ?? null,
  items: [{ id: "reading", type: "TEXT", title: "Reading", content: lesson.content }],
}));
const path = (id) => `/my-learning/courses/${courseId}/lessons/${id}`;
const url = (id) => `/me/courses/${courseId}/lessons/${id}`;

function setup(id = "first") {
  seedSession();
  const http = vi.fn((config) => {
    const lesson = lessons.find((value) => config.url === url(value.id));
    if (config.method === "get" && lesson) return ok(config, lesson);
    if (config.method === "post" && config.url === `${url(id)}/complete`) {
      expect(JSON.parse(config.data)).toEqual({ studyMinutes: 10 });
      return ok(config, { completedLessons: 1, totalLessons: 3, completionPercentage: 33, totalStudyMinutes: 10 });
    }
    throw new Error(`Unexpected lesson request: ${config.method} ${config.url}`);
  });
  setHttpHandler(http);
  const app = mountSession([{
    path: "/my-learning/courses/:courseId/lessons/:lessonId",
    element: <LessonDetail />,
  }], { path: path(id) });
  return { ...app, http, user: userEvent.setup() };
}

describe("Learner lesson TEXT display and navigation", () => {
  it("loads persisted content safely while previous/next navigation and boundary buttons remain functional", async () => {
    const { user, router, http } = setup();
    await screen.findByRole("heading", { name: "First lesson", level: 1 });
    expect(screen.getByRole("main")).toHaveAttribute("lang", "vi");
    expect(screen.getByText("BÀI HỌC")).toBeVisible();
    expect(screen.getByText("A1", { exact: true })).toBeVisible();
    expect(screen.getByText("10 phút", { exact: true })).toBeVisible();
    expect(screen.getByText("Bài học 1", { exact: true })).toBeVisible();
    expect(screen.getByText("Learn everyday German.")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Điều hướng bài học" })).toBeVisible();
    expect(screen.getByRole("article")).toHaveTextContent("Hallo zusammen.");
    expect(screen.getByText("zusammen")).toBeVisible();
    expect(screen.getByText("zusammen").tagName).toBe("STRONG");
    expect(screen.getByRole("button", { name: "Bài học trước" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Bài học tiếp theo" }));
    await screen.findByRole("heading", { name: "Second lesson", level: 1 });
    expect(router.state.location.pathname).toBe(path("second"));
    expect(screen.getByRole("article").querySelector("div").innerHTML).toBe("<p>Persisted lesson.</p>");

    await user.click(screen.getByRole("button", { name: "Bài học trước" }));
    await screen.findByRole("heading", { name: "First lesson", level: 1 });
    expect(router.state.location.pathname).toBe(path("first"));
    expect(screen.getByRole("article")).toHaveTextContent("Hallo zusammen.");

    await user.click(screen.getByRole("button", { name: "Bài học tiếp theo" }));
    await screen.findByRole("heading", { name: "Second lesson", level: 1 });
    await user.click(screen.getByRole("button", { name: "Bài học tiếp theo" }));
    await screen.findByRole("heading", { name: "Third lesson", level: 1 });
    expect(router.state.location.pathname).toBe(path("third"));
    expect(screen.getByText("Auf Wiedersehen.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Bài học tiếp theo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bài học trước" })).toBeEnabled();
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(expect.arrayContaining(lessons.map((lesson) => url(lesson.id))));
  });

  it("preserves completion and sanitized content on a lesson loaded from the backend", async () => {
    const { user, router, http } = setup("second");
    await screen.findByRole("heading", { name: "Second lesson", level: 1 });
    await user.click(screen.getByRole("button", { name: "Hoàn thành bài học" }));

    expect(await screen.findByText("Đã hoàn thành bài học")).toBeVisible();
    expect(screen.getByText("Bạn đã hoàn thành bài học này.")).toBeVisible();
    expect(within(screen.getByRole("article")).getByText("Persisted lesson.")).toBeVisible();
    expect(screen.getByRole("article").querySelector("div").innerHTML).toBe("<p>Persisted lesson.</p>");
    expect(router.state.location.pathname).toBe(path("second"));
    expect(http.mock.calls.map(([config]) => [config.method, config.url])).toEqual([
      ["get", url("second")],
      ["post", `${url("second")}/complete`],
    ]);
  });
});
