import { describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { router as appRouter } from "@/app/router/routes";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";

const courseId = "completed-course";
const publicPath = `/learn-german/courses/${courseId}`;
const coursePath = `/my-learning/courses/${courseId}`;
const viewerUrl = `/courses/${courseId}/viewer`;
const courseUrl = `/me/courses/${courseId}`;
const enrollUrl = `/courses/${courseId}/enroll`;
const lessonPath = (id) => `${coursePath}/lessons/${id}`;
const lessonUrl = (id) => `${courseUrl}/lessons/${id}`;
const lessons = ["Greetings", "Farewells"].map((title, index) => ({
  id: `lesson-${index + 1}`,
  title,
  description: `Practice ${title.toLowerCase()}.`,
  estimatedMinutes: 10,
  orderIndex: index + 1,
  completed: true,
  previousLessonId: index === 0 ? null : "lesson-1",
  nextLessonId: index === 0 ? "lesson-2" : null,
  items: [{ id: `text-${index + 1}`, type: "TEXT", title: "Reading", content: `<p>${title} content.</p>` }],
}));

function courseDetail(enrollmentStatus = "COMPLETED") {
  return {
    id: courseId,
    title: "Everyday German",
    description: "Learn everyday conversations.",
    level: "A1",
    estimatedHours: 1,
    enrollmentStatus,
    completionPercentage: 100,
    completedLessons: 2,
    totalLessons: 2,
    totalStudyMinutes: 20,
    sections: [{ id: "section-1", title: "Conversations", lessons }],
  };
}

function mountCourse({ enrollmentStatus = "COMPLETED", anonymous = false, handler } = {}) {
  if (!anonymous) seedSession();
  const detail = courseDetail(enrollmentStatus);
  const http = vi.fn(handler ?? ((config) => {
    if (config.method === "get") {
      if (config.url === viewerUrl || config.url === courseUrl) return ok(config, detail);
      const lesson = lessons.find((value) => config.url === lessonUrl(value.id));
      if (lesson) return ok(config, lesson);
    }
    throw new Error(`Unexpected course request: ${config.method} ${config.url}`);
  }));
  setHttpHandler(http);
  // Exercise the production pages, AppShell and protected route tree.
  const app = mountSession(appRouter.routes, { path: publicPath });
  return { ...app, http, user: userEvent.setup() };
}

function requests(http) {
  return http.mock.calls.map(([config]) => [config.method, config.url]);
}

describe("Course detail enrollment actions", () => {
  it.each([
    ["COMPLETED", "Review course", "Completed"],
    ["ENROLLED", "Continue learning", "Enrolled"],
    ["IN_PROGRESS", "Continue learning", "In progress"],
  ])("%s navigates to the existing My Course Detail without enrollment or completion mutations", async (status, action, label) => {
    const { user, router, http, client } = mountCourse({ enrollmentStatus: status });
    const button = await screen.findByRole("button", { name: action });
    expect(button).toBeVisible();
    expect(screen.getByText(label, { exact: true })).toBeVisible();
    expect(screen.queryByRole("button", { name: "View certificate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll course" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Everyday German", level: 1 })).toBeVisible();
    expect(screen.getByText("Learn everyday conversations.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Conversations" })).toBeVisible();
    expect(requests(http)).toEqual([["get", viewerUrl]]);

    await user.click(button);
    await screen.findByRole("heading", { name: "Learning Progress" });
    expect(router.state.location.pathname).toBe(coursePath);
    expect(screen.getByRole("heading", { name: "Everyday German", level: 1 })).toBeVisible();
    expect(requests(http)).toEqual([["get", viewerUrl], ["get", courseUrl]]);
    expect(client.getMutationCache().getAll()).toEqual([]);
  });

  it("reviews completed lessons through normal lesson and next/previous navigation with read-only mocked responses", async () => {
    const { user, router, http } = mountCourse();
    await user.click(await screen.findByRole("button", { name: "Review course" }));
    const lessonLink = await screen.findByRole("link", { name: /Greetings/ });
    expect(lessonLink).toHaveAttribute("href", lessonPath("lesson-1"));
    expect(screen.getByText("Completed", { exact: true })).toBeVisible();
    expect(screen.getByText("100%")).toBeVisible();

    await user.click(lessonLink);
    await screen.findByRole("heading", { name: "Greetings", level: 1 });
    expect(router.state.location.pathname).toBe(lessonPath("lesson-1"));
    expect(within(screen.getByRole("article")).getByText("Greetings content.")).toBeVisible();
    expect(screen.getByText("You have completed this lesson.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Complete lesson" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous lesson" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next lesson" }));
    await screen.findByRole("heading", { name: "Farewells", level: 1 });
    expect(router.state.location.pathname).toBe(lessonPath("lesson-2"));
    expect(screen.getByText("Farewells content.")).toBeVisible();
    expect(screen.getByText("You have completed this lesson.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Complete lesson" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next lesson" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Previous lesson" }));
    await screen.findByRole("heading", { name: "Greetings", level: 1 });
    expect(router.state.location.pathname).toBe(lessonPath("lesson-1"));
    expect(requests(http)).toEqual([
      ["get", viewerUrl], ["get", courseUrl],
      ["get", lessonUrl("lesson-1")], ["get", lessonUrl("lesson-2")],
      ["get", lessonUrl("lesson-1")],
    ]);
  });

  it("keeps Review course behind the existing auth guard even for an anonymous completed viewer snapshot", async () => {
    const { user, router, http } = mountCourse({ anonymous: true });
    await user.click(await screen.findByRole("button", { name: "Review course" }));
    await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: coursePath });
    // Anonymous bootstrap can clear/refetch the public query; no private read or mutation is allowed.
    expect(http).toHaveBeenCalled();
    expect(requests(http).every(([method, url]) => method === "get" && url === viewerUrl)).toBe(true);
    expect(screen.queryByRole("heading", { name: "Learning Progress" })).not.toBeInTheDocument();
  });

  it("preserves the authenticated non-enrolled action and existing enrollment endpoint", async () => {
    const { user, router, http } = mountCourse({
      enrollmentStatus: null,
      handler: (config) => {
        if (config.method === "get" && config.url === viewerUrl) return ok(config, courseDetail(null));
        if (config.method === "post" && config.url === enrollUrl) {
          expect(config.data).toBeUndefined();
          return ok(config, { courseId, enrollmentStatus: "ENROLLED" });
        }
        if (config.method === "get" && config.url === courseUrl) return ok(config, courseDetail("ENROLLED"));
        throw new Error(`Unexpected enrollment request: ${config.method} ${config.url}`);
      },
    });
    const button = await screen.findByRole("button", { name: "Enroll course" });
    expect(screen.getByText("Available")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Review course" })).not.toBeInTheDocument();
    await user.click(button);
    await screen.findByRole("heading", { name: "Learning Progress" });
    expect(router.state.location.pathname).toBe(coursePath);
    expect(router.state.historyAction).toBe("REPLACE");
    expect(requests(http)).toEqual([["get", viewerUrl], ["post", enrollUrl], ["get", courseUrl]]);
  });

  it("preserves anonymous enrollment redirect to Login without a mutation", async () => {
    const { user, router, http } = mountCourse({ enrollmentStatus: null, anonymous: true });
    await user.click(await screen.findByRole("button", { name: "Enroll course" }));
    await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: publicPath });
    expect(http).toHaveBeenCalled();
    expect(requests(http).every(([method, url]) => method === "get" && url === viewerUrl)).toBe(true);
  });

  it("keeps loading content until the viewer response confirms the enrollment state", async () => {
    const response = deferred();
    const { http } = mountCourse({ handler: () => response.promise });
    expect(screen.getByText("Đang tải...")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Review course" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll course" })).not.toBeInTheDocument();
    await act(async () => response.resolve(ok(http.mock.calls[0][0], courseDetail())));
    expect(await screen.findByRole("button", { name: "Review course" })).toBeVisible();
    expect(screen.queryByText("Đang tải...")).not.toBeInTheDocument();
    expect(requests(http)).toEqual([["get", viewerUrl]]);
  });

  it("preserves the course error state and explicit retry without an enrollment mutation", async () => {
    let attempts = 0;
    const { user, http } = mountCourse({ handler: (config) => {
      attempts += 1;
      return attempts === 1 ? fail(config, 500) : ok(config, courseDetail());
    } });
    await screen.findByRole("heading", { name: "Đã xảy ra lỗi" });
    expect(screen.queryByRole("button", { name: "Review course" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll course" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("button", { name: "Review course" })).toBeVisible();
    expect(requests(http)).toEqual([["get", viewerUrl], ["get", viewerUrl]]);
  });

  it("preserves not-found course handling without rendering an action", async () => {
    const { http } = mountCourse({ handler: (config) => fail(config, 404) });
    await screen.findByRole("heading", { name: "Không tìm thấy tài nguyên" });
    expect(screen.queryByRole("button", { name: "Review course" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll course" })).not.toBeInTheDocument();
    expect(requests(http)).toEqual([["get", viewerUrl]]);
  });
});
