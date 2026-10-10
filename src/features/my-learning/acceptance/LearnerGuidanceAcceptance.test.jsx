import { describe, it, expect } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { ATTEMPT_ID, attemptPath, attemptUrl } from "@/features/assessment/test/attempt-fixtures";
import { TASK_ID, TASK_KEY, TASK_PATH, TASK_URL, TASK_SUBMIT_URL } from "@/features/assessment/test/task-fixtures";
import { FINAL_URL } from "@/features/assessment/test/final-submit-fixtures";
import {
  COURSE_ID, LESSON_IDS, lessonUrl, lessonPath, DEFINITION_URL, TRIAD_URLS, TRIAD_KEYS,
  guidanceServer, requestWindow, captureGuidance, expectGuidanceStaleness, expectDashboard,
  returnToDashboard, expectNoHiddenGuidance,
} from "./guidance-fixtures";

const guidanceLink = (label) => within(screen.getByRole("region", { name: "Hướng dẫn học tập" }))
  .getByRole("link", { name: label, exact: true });
const assessmentText = "Quay lại bài đánh giá để tiếp tục.";
const taskText = "Tiếp tục bài tập đánh giá đang thực hiện.";
const lessonText = "Tiếp tục với bài học tiếp theo của bạn.";

function expectTriadEntries(server, count) {
  const actual = requestWindow(server.http).filter(([, url]) => TRIAD_URLS.includes(url));
  expect(actual.sort()).toEqual(Array.from({ length: count }, () =>
    TRIAD_URLS.map((url) => ["get", url, undefined])).flat().sort());
}
function expectWrites(server, expected) {
  expect(requestWindow(server.http).filter(([method]) => method !== "get")).toEqual(expected);
}
async function openParent(user, server, app) {
  const from = server.http.mock.calls.length;
  server.allowReads([attemptUrl, DEFINITION_URL]);
  await user.click(guidanceLink("Xem bài đánh giá"));
  await screen.findByText("Status: In progress");
  expect(app.router.state.location.pathname).toBe(attemptPath);
  expect(app.client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID])).toEqual(server.parent());
  expect(requestWindow(server.http, from).sort()).toEqual([
    ["get", attemptUrl, undefined], ["get", DEFINITION_URL, undefined],
  ].sort());
}

describe("Learner Guidance integrated acceptance", () => {
  it("A: returns from explicit Task Start and Submit to canonical OPEN_ASSESSMENT / RESUME_ASSESSMENT_TASK guidance", async () => {
    const user = userEvent.setup();
    const server = guidanceServer("assessment-child");
    const app = mountAssessmentApp("/my-learning");
    const originalClient = app.client;
    expect(server.parent().taskAttempts).toEqual([]);
    await expectDashboard(server, app, 0, "Xem bài đánh giá", assessmentText, attemptPath);
    const originalQueries = captureGuidance(app.client);

    await openParent(user, server, app);
    const beforeStart = captureGuidance(app.client);
    const row = screen.getByText("Task 4").closest("li");
    const startWindow = await server.clickWrite(user, within(row).getByRole("button", { name: "Start task" }), TASK_URL, {
      reads: [TASK_URL, DEFINITION_URL],
    });
    await screen.findByRole("radio", { name: "Hallo" });
    await waitFor(() => expect(app.client.isMutating()).toBe(0));
    expect(app.router.state.location.pathname).toBe(TASK_PATH);
    expect(server.parent().taskAttempts).toEqual([{ taskId: TASK_ID, quizAttemptId: "quiz-owned-42" }]);
    expect(server.runtimes.get(TASK_ID).status).toBe("IN_PROGRESS");
    expect(app.client.getQueryData(TASK_KEY)).toEqual(server.runtimes.get(TASK_ID));
    expectGuidanceStaleness(app.client, beforeStart, [false, false, true]);
    expectNoHiddenGuidance(server, startWindow);
    expect(requestWindow(server.http, startWindow).sort()).toEqual([
      ["post", TASK_URL, undefined], ["get", TASK_URL, undefined], ["get", DEFINITION_URL, undefined],
    ].sort());

    const afterStartReturn = await returnToDashboard(user, server);
    await expectDashboard(server, app, afterStartReturn, "Tiếp tục bài tập", taskText, TASK_PATH, originalQueries);
    expect(app.client).toBe(originalClient);
    expect(app.client.getQueryData(TRIAD_KEYS[2]).target).toEqual({
      assessmentAttemptId: ATTEMPT_ID, taskId: TASK_ID, quizAttemptId: "quiz-owned-42",
    });
    expect(guidanceLink("Tiếp tục bài tập").getAttribute("href")).not.toContain("quiz-owned-42");
    const resumeWindow = server.http.mock.calls.length;
    server.allowReads([TASK_URL, DEFINITION_URL]);
    await user.click(guidanceLink("Tiếp tục bài tập"));
    await screen.findByRole("button", { name: "Submit task" });
    await waitFor(() => expect(app.client.getQueryState(TASK_KEY).fetchStatus).toBe("idle"));
    expect(app.router.state.location.pathname).toBe(TASK_PATH);
    expect(app.client.getQueryData(TASK_KEY)).toEqual(server.runtimes.get(TASK_ID));
    expect(requestWindow(server.http, resumeWindow).sort()).toEqual([
      ["get", TASK_URL, undefined], ["get", DEFINITION_URL, undefined],
    ].sort());

    const beforeSubmit = captureGuidance(app.client);
    const submitWindow = await server.clickWrite(user, screen.getByRole("button", { name: "Submit task" }), TASK_SUBMIT_URL);
    await screen.findByText("Status: Submitted");
    await waitFor(() => expect(app.client.isMutating()).toBe(0));
    expect(server.runtimes.get(TASK_ID).status).toBe("SUBMITTED");
    expect(server.parent().status).toBe("IN_PROGRESS");
    expect(app.client.getQueryData(TASK_KEY).status).toBe("SUBMITTED");
    expectGuidanceStaleness(app.client, beforeSubmit, [false, false, true]);
    expectNoHiddenGuidance(server, submitWindow);
    expect(requestWindow(server.http, submitWindow)).toEqual([["post", TASK_SUBMIT_URL, undefined]]);

    const afterSubmitReturn = await returnToDashboard(user, server);
    await expectDashboard(server, app, afterSubmitReturn, "Xem bài đánh giá", assessmentText, attemptPath, originalQueries);
    expect(app.client).toBe(originalClient);
    expect(app.client.getQueryData(TRIAD_KEYS[0]).assessmentAttempts).toHaveLength(1);
    expect(app.client.getQueryData(TRIAD_KEYS[1]).type).toBe("RESUME_ASSESSMENT");
    expect(app.client.getQueryData(TRIAD_KEYS[2]).type).toBe("OPEN_ASSESSMENT");
    expectTriadEntries(server, 3);
    expectWrites(server, [["post", TASK_URL, undefined], ["post", TASK_SUBMIT_URL, undefined]]);
  });

  it("B: hands off Backend-selected Assessment priority to Course / OPEN_LESSON after terminal finalization", async () => {
    const user = userEvent.setup();
    const server = guidanceServer("finalization-handoff");
    const app = mountAssessmentApp("/experiences");
    const originalClient = app.client;
    await act(async () => {});
    expect(server.http).not.toHaveBeenCalled();
    const entry = await returnToDashboard(user, server);
    await expectDashboard(server, app, entry, "Xem bài đánh giá", assessmentText, attemptPath);
    const originalQueries = captureGuidance(app.client);
    const initialJourney = app.client.getQueryData(TRIAD_KEYS[0]);
    expect(initialJourney.assessmentAttempts).toHaveLength(1);
    expect(initialJourney.courses[0].courseId).toBe(COURSE_ID);
    expect(app.client.getQueryData(TRIAD_KEYS[1]).type).toBe("RESUME_ASSESSMENT");
    expect(server.tasks.every((task) => server.runtimes.get(task.taskId).status === "SUBMITTED")).toBe(true);

    await openParent(user, server, app);
    expect(server.parent().taskAttempts).toHaveLength(server.tasks.length);
    const beforeFinal = captureGuidance(app.client);
    const finalWindow = await server.clickWrite(user, screen.getByRole("button", { name: "Submit assessment" }), FINAL_URL, {
      reads: [attemptUrl],
    });
    await screen.findByText("Assessment finalized successfully.");
    await waitFor(() => expect(app.client.isMutating()).toBe(0));
    expect(server.parent().status).toBe("COMPLETED");
    expect(app.client.getQueryData(["learner-assessment-attempt", ATTEMPT_ID]).status).toBe("COMPLETED");
    expect(app.router.state.location.pathname).toBe(attemptPath);
    expectGuidanceStaleness(app.client, beforeFinal, [true, true, true]);
    expectNoHiddenGuidance(server, finalWindow);
    expect(requestWindow(server.http, finalWindow)).toEqual([
      ["post", FINAL_URL, undefined], ["get", attemptUrl, undefined],
    ]);

    const handoffReturn = await returnToDashboard(user, server);
    await expectDashboard(server, app, handoffReturn, "Mở bài học tiếp theo", lessonText, lessonPath(LESSON_IDS[0]), originalQueries);
    expect(app.client).toBe(originalClient);
    const freshJourney = app.client.getQueryData(TRIAD_KEYS[0]);
    expect(freshJourney.assessmentAttempts).toEqual([]);
    expect(freshJourney.courses).toEqual(initialJourney.courses);
    expect(app.client.getQueryData(TRIAD_KEYS[1])).toEqual({ type: "CONTINUE_COURSE", target: { courseId: COURSE_ID } });
    expect(app.client.getQueryData(TRIAD_KEYS[2])).toEqual({
      type: "OPEN_LESSON", target: { courseId: COURSE_ID, lessonId: LESSON_IDS[0] },
    });
    expectTriadEntries(server, 2);
    expectWrites(server, [["post", FINAL_URL, undefined]]);
  });

  it("C: completes two real Lessons with fresh canonical progression and ends in NONE / DISCOVER_COURSE fallback", async () => {
    const user = userEvent.setup();
    const server = guidanceServer("course-progression");
    const app = mountAssessmentApp("/my-learning");
    const originalClient = app.client;
    await expectDashboard(server, app, 0, "Mở bài học tiếp theo", lessonText, lessonPath(LESSON_IDS[0]));
    const originalQueries = captureGuidance(app.client);
    expect(screen.getByText("0 / 2 bài học")).toBeVisible();

    for (const [index, id] of LESSON_IDS.entries()) {
      expect(guidanceLink("Mở bài học tiếp theo")).toHaveAttribute("href", lessonPath(id));
      const lessonWindow = server.http.mock.calls.length;
      server.allowReads([lessonUrl(id)]);
      await user.click(guidanceLink("Mở bài học tiếp theo"));
      await screen.findByRole("heading", { name: server.lessons[index].title, level: 1 });
      expect(screen.getByText("Read the dialogue aloud and practice with a partner.")).toBeVisible();
      expect(app.router.state.location.pathname).toBe(lessonPath(id));
      expect(requestWindow(server.http, lessonWindow)).toEqual([["get", lessonUrl(id), undefined]]);
      const beforeComplete = captureGuidance(app.client);
      const body = { studyMinutes: server.lessons[index].estimatedMinutes };
      const completeWindow = await server.clickWrite(user, screen.getByRole("button", { name: "Complete lesson" }),
        `${lessonUrl(id)}/complete`, { body });
      await screen.findByText("Lesson completed");
      await waitFor(() => expect(app.client.isMutating()).toBe(0));
      expect(screen.getByText("You have completed this lesson.")).toBeVisible();
      expect(server.state.progress).toEqual({
        completedLessons: index + 1, totalLessons: 2, completionPercentage: (index + 1) * 50,
        totalStudyMinutes: index === 0 ? 10 : 25,
      });
      expect(server.state.enrollmentStatus).toBe(index === 0 ? "IN_PROGRESS" : "COMPLETED");
      expectGuidanceStaleness(app.client, beforeComplete, [true, true, true]);
      expectNoHiddenGuidance(server, completeWindow);
      expect(requestWindow(server.http, completeWindow)).toEqual([["post", `${lessonUrl(id)}/complete`, body]]);
      const dashboardReturn = await returnToDashboard(user, server);
      if (index === 0) {
        await expectDashboard(server, app, dashboardReturn, "Mở bài học tiếp theo", lessonText, lessonPath(LESSON_IDS[1]), originalQueries);
        expect(screen.getByText("1 / 2 bài học")).toBeVisible();
        expect(screen.getByRole("progressbar")).toHaveAttribute("value", "50");
        expect(app.client.getQueryData(TRIAD_KEYS[0]).courses[0].progress).toEqual(server.state.progress);
        expect(app.client.getQueryData(TRIAD_KEYS[1])).toEqual({ type: "CONTINUE_COURSE", target: { courseId: COURSE_ID } });
      } else {
        await expectDashboard(server, app, dashboardReturn, "Khám phá khóa học",
          "Chọn một khóa học để bắt đầu hoặc tiếp tục học tiếng Đức.", "/learn-german", originalQueries);
        expect(app.client.getQueryData(TRIAD_KEYS[0]).courses).toEqual([]);
        expect(app.client.getQueryData(TRIAD_KEYS[1])).toEqual({ type: "DISCOVER_COURSE", target: null });
        expect(app.client.getQueryData(TRIAD_KEYS[2])).toEqual({ type: "NONE", target: null });
        expect(screen.queryByText("German Basics")).not.toBeInTheDocument();
        expect(screen.getByText("Bạn chưa có khóa học nào")).toBeVisible();
        expect(screen.getByRole("heading", { name: "Học tập của tôi", level: 1 }).closest("main").textContent)
          .not.toMatch(/learning complete|nothing left|no more learning|all learning finished|you are done|học xong|không còn|hoàn thành toàn bộ|đã xong/i);
      }
      expect(app.client).toBe(originalClient);
    }
    expectTriadEntries(server, 3);
    expectWrites(server, LESSON_IDS.map((id, index) => [
      "post", `${lessonUrl(id)}/complete`, { studyMinutes: server.lessons[index].estimatedMinutes },
    ]));
  });
});
