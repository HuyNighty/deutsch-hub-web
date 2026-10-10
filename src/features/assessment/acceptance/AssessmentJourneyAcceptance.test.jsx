import { seedNextActivity } from "@/test/next-activity-fixtures";
import { nextActivityKey } from "@/features/my-learning/guidance/hooks/useNextActivity";
import { seedDirection } from "@/test/direction-fixtures";
import { learningDirectionKey } from "@/features/my-learning/guidance/hooks/useLearningDirection";
import { describe, it, expect } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred } from "@/test/http";
import { mountAssessmentApp } from "../test/assessment-app";
import { detailPath, attemptPath, attemptUrl, startUrl, journeyUrl, ATTEMPT_ID } from "../test/attempt-fixtures";
import { FINAL_URL } from "../test/final-submit-fixtures";
import { RESULT_PATH, RESULT_URL, RESULT_KEY, COMPETENCY_URL, COMPETENCY_KEY, competency } from "../test/result-fixtures";
import {
  CATALOG_PATH, DEFINITION_URL, DEFINITION_KEY, PARENT_KEY, taskUrl, taskPath, taskKey,
  journeyServer, openTask, submitAndReturn, expectOfficialResult, expectNoTaskFeedback, requestSequence, writes,
} from "./journey-fixtures";

describe("Learner Assessment integrated journey", () => {
  it("composes discovery, five explicit Task submissions, final settlement, independent Result and cold reload", async () => {
    const user = userEvent.setup();
    const answerGate = deferred();
    const server = journeyServer({ answerGate });
    const app = mountAssessmentApp(CATALOG_PATH);
    const { router, client } = app;
    await screen.findByRole("heading", { name: "Assessments", level: 1 });
    await user.click(await screen.findByRole("link", { name: "View assessment" }));
    await screen.findByRole("button", { name: "Start Assessment" });
    expect(router.state.location.pathname).toBe(detailPath);
    expect(requestSequence(server.http)).toEqual([
      ["get", "/me/assessments"], ["get", detailPath.replace("/my-learning", "/me")], ["get", journeyUrl],
    ]);
    expect(writes(server.http)).toEqual([]);
    await server.clickWrite(user, screen.getByRole("button", { name: "Start Assessment" }), "post", startUrl);
    await screen.findByText("Status: In progress");
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(client.getQueryData(PARENT_KEY)).toEqual(server.parent());
    expect(client.getQueryData(DEFINITION_KEY)).toEqual(server.definition);
    expect(server.parent().taskAttempts).toEqual([]);
    expect(writes(server.http)).toEqual([["post", startUrl]]);

    const coarseDirection = seedDirection(client);
    const first = server.tasks[0];
    await openTask(user, server, first);
    expect(router.state.location.pathname).toBe(taskPath(first));
    expect(client.getQueryData(taskKey(first))).toEqual(server.runtimes.get(first.taskId));
    const answerUrl = `${taskUrl(first)}/answers/question-single`;
    await server.clickWrite(user, screen.getByRole("radio", { name: "Hallo" }), "put", answerUrl, { selectedAnswerIds: ["answer-hallo"] });
    // The write is still waiting for a server response: no optimistic selection.
    expect(screen.getByRole("radio", { name: "Guten Tag" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Hallo" })).not.toBeChecked();
    expect(client.getQueryData(taskKey(first)).questions[0].selectedAnswerIds).toEqual(["answer-guten-tag"]);
    await act(async () => { answerGate.resolve(); });
    await waitFor(() => expect(screen.getByRole("radio", { name: "Hallo" })).toBeChecked());
    expect(client.getQueryData(taskKey(first)).questions[0].selectedAnswerIds).toEqual(["answer-hallo"]);
    await server.clickWrite(user, screen.getByRole("button", { name: "Clear answer" }), "delete", answerUrl);
    await waitFor(() => expect(screen.getByRole("radio", { name: "Hallo" })).not.toBeChecked());
    expect(client.getQueryData(taskKey(first)).questions[0].selectedAnswerIds).toEqual([]);
    await server.clickWrite(user, screen.getByRole("radio", { name: "Hallo" }), "put", answerUrl, { selectedAnswerIds: ["answer-hallo"] });
    await waitFor(() => expect(screen.getByRole("radio", { name: "Hallo" })).toBeChecked());
    expectNoTaskFeedback();
    await submitAndReturn(user, server, first, router);
    expect(client.getQueryData(taskKey(first)).status).toBe("SUBMITTED");
    expect(client.getQueryData(PARENT_KEY).status).toBe("IN_PROGRESS");
    expect(server.parent().taskAttempts).toHaveLength(1);
    for (const task of server.tasks.slice(1)) {
      await openTask(user, server, task);
      await submitAndReturn(user, server, task, router);
      expect(client.getQueryData(taskKey(task)).status).toBe("SUBMITTED");
      expect(client.getQueryData(PARENT_KEY)).toEqual(server.parent());
    }
    coarseDirection(false);
    expect(server.runtimes.size).toBe(5);
    expect(server.state.status).toBe("IN_PROGRESS");
    const expectedWrites = [
      ["post", startUrl], ["post", taskUrl(first)], ["put", answerUrl], ["delete", answerUrl], ["put", answerUrl],
      ["post", `${taskUrl(first)}/submit`],
      ...server.tasks.slice(1).flatMap((task) => [["post", taskUrl(task)], ["post", `${taskUrl(task)}/submit`]]),
    ];
    expect(writes(server.http)).toEqual(expectedWrites);

    // Inactive cache probes expose only the known finalization invalidation boundary.
    client.getQueryCache().build(client, { queryKey: RESULT_KEY });
    client.setQueryData(COMPETENCY_KEY, competency());
    const unrelated = [
      ["learner-assessment-attempt", "other-attempt"], ["learner-assessment-result", "other-attempt"],
      ["learner-assessment-task-quiz", "other-attempt", first.taskId],
      ["learner-assessment-result", ATTEMPT_ID, "suffix"], ["learner-competency", "suffix"],
      ["learner-learning-journey", "suffix"], ["my-courses"], ["content"],
    ];
    for (const key of unrelated) client.setQueryData(key, { untouched: true });
    const direction = seedDirection(client);
    const activity = seedNextActivity(client);
    const definitionBefore = client.getQueryState(DEFINITION_KEY);
    const beforeFinal = server.http.mock.calls.length;
    await server.clickWrite(user, screen.getByRole("button", { name: "Submit assessment" }), "post", FINAL_URL);
    await screen.findByText("Assessment finalized successfully.");
    expect(requestSequence(server.http).slice(beforeFinal)).toEqual([["post", FINAL_URL], ["get", attemptUrl]]);
    expect(router.state.location.pathname).toBe(attemptPath);
    expect(screen.getByText("Status: Completed")).toBeInTheDocument();
    expect(client.getQueryData(PARENT_KEY)).toEqual(server.parent());
    expect(screen.queryByRole("region", { name: "Kết quả đánh giá chính thức" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Trình độ tiếng Đức hiện tại" })).not.toBeInTheDocument();
    expect(client.getQueryData(RESULT_KEY)).toBeUndefined();
    expect(client.getQueryData(COMPETENCY_KEY)).toEqual(competency());
    direction(true);
    activity(true);
    for (const key of [RESULT_KEY, COMPETENCY_KEY, learningDirectionKey, nextActivityKey, ["learner-learning-journey"], ...server.tasks.map(taskKey)]) {
      expect(client.getQueryState(key).isInvalidated).toBe(true);
    }
    expect(client.getQueryState(DEFINITION_KEY).isInvalidated).toBe(false);
    expect(client.getQueryData(DEFINITION_KEY)).toEqual(server.definition);
    expect(client.getQueryState(DEFINITION_KEY).dataUpdatedAt).toBe(definitionBefore.dataUpdatedAt);
    for (const key of unrelated) {
      expect(client.getQueryState(key).isInvalidated).toBe(false);
      expect(client.getQueryData(key)).toEqual({ untouched: true });
    }
    const beforeResult = server.http.mock.calls.length;
    await user.click(screen.getByRole("link", { name: "View result" }));
    await expectOfficialResult(server, client);
    expect(router.state.location.pathname).toBe(RESULT_PATH);
    expect(requestSequence(server.http).slice(beforeResult).sort()).toEqual([
      ["get", DEFINITION_URL], ["get", RESULT_URL], ["get", COMPETENCY_URL],
    ].sort());
    expect(writes(server.http)).toEqual([...expectedWrites, ["post", FINAL_URL]]);

    app.unmount();
    const beforeReload = server.http.mock.calls.length;
    const reload = mountAssessmentApp(RESULT_PATH);
    expect(reload.client).not.toBe(client);
    expect(reload.client.getQueryData(PARENT_KEY)).toBeUndefined();
    await expectOfficialResult(server, reload.client);
    expect(requestSequence(server.http).slice(beforeReload).sort()).toEqual([
      ["get", DEFINITION_URL], ["get", RESULT_URL], ["get", COMPETENCY_URL],
    ].sort());
    expect(reload.router.state.location.pathname).toBe(RESULT_PATH);
    expect(writes(server.http)).toEqual([...expectedWrites, ["post", FINAL_URL]]);
  });

  it("returns anonymous direct Result entry through real login and reads Competency independently", async () => {
    const user = userEvent.setup();
    const competencyGate = deferred();
    const server = journeyServer({ finalized: true, competencyGate });
    const { router, client, auth } = mountAssessmentApp(RESULT_PATH, { anonymous: true });
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: RESULT_PATH });
    expect(server.http).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Tên đăng nhập hoặc email"), "learner-a");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ }));
    await screen.findByText("Kết quả tổng thể: Đạt");
    expect(router.state.location.pathname).toBe(RESULT_PATH);
    expect(auth.current.status).toBe("AUTHENTICATED");
    expect(client.getQueryData(RESULT_KEY)).toEqual(server.result);
    expect(client.getQueryData(COMPETENCY_KEY)).toBeUndefined();
    const current = screen.getByRole("region", { name: "Trình độ tiếng Đức hiện tại" });
    expect(within(current).getByRole("status")).toHaveTextContent("Đang tải trình độ tiếng Đức hiện tại");
    await act(async () => { competencyGate.resolve(); });
    await expectOfficialResult(server, client);
    expect(requestSequence(server.http).filter(([, url]) => url.startsWith("/me/")).sort()).toEqual([
      ["get", DEFINITION_URL], ["get", RESULT_URL], ["get", COMPETENCY_URL],
    ].sort());
    expect(server.http.mock.calls.filter(([config]) => config.url === "/auth/login")).toHaveLength(1);
    expect(writes(server.http)).toEqual([]);
    expect(client.getQueryData(PARENT_KEY)).toBeUndefined();
  });
});
