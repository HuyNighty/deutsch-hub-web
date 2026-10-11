import { useState } from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { fail, ok, setHttpHandler } from "@/test/http";
import { COURSE_ID, seedCourseState, expectCourseState } from "@/test/course-state-fixtures";
import CompleteLessonButton from "../components/CompleteLessonButton";
import useCompleteLesson from "./useCompleteLesson";

const lesson = { id: "lesson-one", completed: false, estimatedMinutes: 10 };
const completeUrl = `/me/courses/${COURSE_ID}/lessons/${lesson.id}/complete`;
afterEach(() => { vi.restoreAllMocks(); });

function Lesson({ onCompleted }) {
  const [completed, setCompleted] = useState(false);
  return <CompleteLessonButton courseId={COURSE_ID} lesson={{ ...lesson, completed }} onCompleted={() => {
    onCompleted();
    setCompleted(true);
  }} />;
}

describe("Complete Lesson cache coherence", () => {
  it("invalidates exact Journey and Course detail without patching or fetching Journey and preserves completed presentation", async () => {
    seedSession();
    const cache = seedCourseState();
    const onCompleted = vi.fn();
    const http = vi.fn((config) => {
      expect(config.url).toBe(completeUrl);
      expect(config.method).toBe("post");
      expect(JSON.parse(config.data)).toEqual({ studyMinutes: 10 });
      return ok(config, { completedLessons: 4, totalLessons: 8, completionPercentage: 50, totalStudyMinutes: 100 });
    });
    setHttpHandler(http);
    const { router } = mountSession([{ path: "/lesson", element: <Lesson onCompleted={onCompleted} /> }], {
      path: "/lesson", client: cache.client,
    });
    expect(http).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Hoàn thành bài học" }));
    await screen.findByText("Đã hoàn thành bài học");
    expect(screen.getByText("Bạn đã hoàn thành bài học này.")).toBeVisible();
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expectCourseState(cache, true);
    expect(router.state.location.pathname).toBe("/lesson");
    expect(http.mock.calls.map(([config]) => [config.method, config.url])).toEqual([["post", completeUrl]]);
  });

  it("handles an ordinary authorization failure without rejecting, logging, completion or cache invalidation", async () => {
    seedSession();
    const cache = seedCourseState();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const http = vi.fn((config) => fail(config, 403));
    setHttpHandler(http);
    let completion;
    function Probe() {
      completion = useCompleteLesson(COURSE_ID, lesson.id);
      return completion.error ? <p role="alert">{completion.error.message}</p> : <p>Lesson not completed</p>;
    }
    const { router } = mountSession([{ path: "/lesson", element: <Probe /> }], { path: "/lesson", client: cache.client });
    await act(async () => {
      expect(completion.handleComplete(10)).toBeUndefined();
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Bạn không có quyền hoàn thành bài học này.");
    expect(completion.error).toMatchObject({ status: 403 });
    expect(console.log).not.toHaveBeenCalled();
    expect(screen.queryByText("Đã hoàn thành bài học")).not.toBeInTheDocument();
    expectCourseState(cache);
    expect(router.state.location.pathname).toBe("/lesson");
    expect(http.mock.calls.map(([config]) => [config.method, config.url])).toEqual([["post", completeUrl]]);
  });
});
