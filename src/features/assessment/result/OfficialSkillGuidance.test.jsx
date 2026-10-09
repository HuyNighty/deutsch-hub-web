import { describe, it, expect, vi } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deferred, fail, ok } from "@/test/http";
import { loginResult } from "@/test/session-fixtures";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { mountAssessmentApp } from "../test/assessment-app";
import { assessmentDetail } from "../test/fixtures";
import { attemptUrl } from "../test/attempt-fixtures";
import {
  RESULT_PATH, RESULT_URL, RESULT_KEY, COMPETENCY_URL, COMPETENCY_KEY,
  competency, resultFixture, resultHttp,
} from "../test/result-fixtures";
import * as catalog from "./guidance/skill-guidance";

const labels = { WRITING: "Viết", LISTENING: "Nghe", READING: "Đọc", SPEAKING: "Nói" };
const guidanceRegions = () => screen.queryAllByRole("region", { name: /^Gợi ý học tập kỹ năng/ });

describe("Official Result with Vietnamese curated skill guidance", () => {
  it.each(["A1", "A2", "B1"])("uses %s target and each official component outcome, preserving order and percentages", async (targetLevel) => {
    const definition = assessmentDetail({ targetLevel });
    const result = resultFixture({ targetLevel });
    result.componentResults.find((component) => component.skillDimension === "READING").performance = 95.25;
    const http = resultHttp({ definition, result, state: competency({ currentLevel: "C2" }) });
    const { client } = mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Kết quả tổng thể: Chưa đạt");
    const evidence = screen.getByRole("region", { name: "Kết quả đánh giá chính thức" });
    expect(within(evidence).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent))
      .toEqual(["Viết", "Nghe", "Đọc", "Nói"]);
    for (const component of definition.components) {
      const official = result.componentResults.find((item) => item.componentId === component.componentId);
      const card = within(evidence).getByRole("article", { name: `Kết quả kỹ năng ${labels[component.skillDimension]}` });
      expect(within(card).getByText(`Tỷ lệ thực hiện: ${official.performance}%`)).toBeInTheDocument();
      expect(within(card).getByText(`Kết quả: ${official.passed ? "Đạt" : "Chưa đạt"}`)).toBeInTheDocument();
      const id = `${official.skillDimension.toLowerCase()}.${targetLevel === "B1" ? "generic" : targetLevel.toLowerCase()}.${official.passed ? "passed" : "not_passed"}`;
      const entry = catalog.guidanceEntries.find((item) => item.id === id);
      const suggestion = within(card).getByRole("region", { name: `Gợi ý học tập kỹ năng ${labels[component.skillDimension]}` });
      expect([...suggestion.querySelectorAll("p")].map((paragraph) => paragraph.textContent))
        .toEqual(entry.content.split("\n\n"));
    }
    expect(await within(screen.getByRole("region", { name: "Trình độ tiếng Đức hiện tại" })).findByText("C2")).toBeInTheDocument();
    expect(client.getQueryData(RESULT_KEY)).toEqual(result);
    expect(http.mock.calls.map(([config]) => config.url).sort()).toEqual([`${attemptUrl}/assessment`, RESULT_URL, COMPETENCY_URL].sort());
    expect(http.mock.calls.every(([config]) => config.method === "get" && config.data === undefined)).toBe(true);
  });

  it("keeps official evidence visible without a placeholder when guidance is missing", async () => {
    vi.spyOn(catalog, "selectSkillGuidance").mockReturnValue(null);
    const http = resultHttp();
    mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Kết quả tổng thể: Chưa đạt");
    expect(screen.getByText("Tỷ lệ thực hiện: 37.5%")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(guidanceRegions()).toHaveLength(0);
    expect(screen.queryByText(/Gợi ý học tập|không có gợi ý/i)).not.toBeInTheDocument();
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });

  it.each([403, 404, 500])("displays no guidance for unavailable or forbidden Result %s", async (status) => {
    const http = resultHttp({ handler: (config) => config.url === RESULT_URL ? fail(config, status)
      : ok(config, config.url === COMPETENCY_URL ? competency() : assessmentDetail()) });
    const { auth, client } = mountAssessmentApp(RESULT_PATH);
    const region = await screen.findByRole("region", { name: "Kết quả đánh giá chính thức" });
    await within(region).findByRole("alert");
    expect(guidanceRegions()).toHaveLength(0);
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(client.getQueryData(RESULT_KEY)).toBeUndefined();
    expect(auth.current.isAuthenticated).toBe(true);
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });

  it("hides cached guidance after a malformed Result refresh without changing the historical cache", async () => {
    let valid = true;
    const http = resultHttp({ handler: (config) => {
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail());
      if (config.url === COMPETENCY_URL) return ok(config, competency());
      return ok(config, valid ? resultFixture() : resultFixture({ targetLevel: "UNKNOWN" }));
    } });
    const { client } = mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Kết quả tổng thể: Chưa đạt");
    expect(guidanceRegions()).toHaveLength(4);
    valid = false;
    await act(async () => { await client.refetchQueries({ queryKey: RESULT_KEY, exact: true }); });
    await within(screen.getByRole("region", { name: "Kết quả đánh giá chính thức" })).findByRole("alert");
    expect(guidanceRegions()).toHaveLength(0);
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(client.getQueryData(RESULT_KEY)).toEqual(resultFixture());
    expect(client.getQueryState(RESULT_KEY).error.message).toContain("invalid assessment result response");
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });

  it("never renders item-level evidence even if extra response fields contain it", async () => {
    const secret = "SECRET_ITEM_EVIDENCE";
    const result = resultFixture({ questions: [secret], selectedAnswers: [secret], correctAnswers: [secret],
      questionResults: [{ correct: true, earnedScore: 42, content: secret }] });
    result.componentResults[0].questionResults = [{ content: secret }];
    const http = resultHttp({ result });
    mountAssessmentApp(RESULT_PATH);
    await screen.findByText("Kết quả tổng thể: Chưa đạt");
    const page = screen.getByRole("region", { name: "Trang kết quả đánh giá" });
    expect(page.textContent).not.toContain(secret);
    expect(page.querySelector("input, textarea")).toBeNull();
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });

  it("clears Result and guidance on logout before another learner signs in", async () => {
    const user = userEvent.setup();
    let learner = "A";
    const http = resultHttp({ handler: (config) => {
      if (config.url === "/auth/login") { learner = "B"; return ok(config, loginResult()); }
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail({ targetLevel: learner === "A" ? "A1" : "A2" }));
      if (config.url === RESULT_URL) return ok(config, resultFixture({ targetLevel: learner === "A" ? "A1" : "A2" }));
      return ok(config, competency());
    } });
    const { auth, client, router } = mountAssessmentApp(RESULT_PATH);
    const oldEntry = catalog.guidanceEntries.find((entry) => entry.id === "reading.a1.not_passed");
    await screen.findByText(oldEntry.content.split("\n\n")[0]);
    await act(async () => { auth.current.logout(); });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(router.state.location.state).toEqual({ returnTo: RESULT_PATH });
    expect(client.getQueryData(RESULT_KEY)).toBeUndefined();
    expect(client.getQueryData(COMPETENCY_KEY)).toBeUndefined();
    expect(guidanceRegions()).toHaveLength(0);
    await user.type(screen.getByLabelText("Username or Email"), "learner-b");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /Login to DeutschHub/ }));
    const newEntry = catalog.guidanceEntries.find((entry) => entry.id === "reading.a2.not_passed");
    await screen.findByText(newEntry.content.split("\n\n")[0]);
    expect(screen.queryByText(oldEntry.content.split("\n\n")[0])).not.toBeInTheDocument();
    expect(client.getQueryData(RESULT_KEY).targetLevel).toBe("A2");
    expect(http.mock.calls.filter(([config]) => config.method !== "get").map(([config]) => config.url)).toEqual(["/auth/login"]);
  });

  it.each(["success", "failure"])("fences delayed learner A Result %s after learner B session replacement", async (resolution) => {
    const oldResponse = deferred();
    const oldStarted = deferred();
    let learner = "A";
    const http = resultHttp({ handler: (config) => {
      if (config.url === `${attemptUrl}/assessment`) return ok(config, assessmentDetail({ targetLevel: learner === "A" ? "A1" : "A2" }));
      if (config.url === COMPETENCY_URL) return ok(config, competency());
      if (learner === "A") {
        oldStarted.resolve();
        return oldResponse.promise.then(() => resolution === "failure" ? fail(config, 401)
          : ok(config, resultFixture({ targetLevel: "A1" })));
      }
      return ok(config, resultFixture({ targetLevel: "A2" }));
    } });
    const { auth, client } = mountAssessmentApp(RESULT_PATH);
    await act(async () => { await oldStarted.promise; });
    const oldGeneration = getSessionGeneration();
    learner = "B";
    await act(async () => { auth.current.setSession(loginResult()); });
    await screen.findByText("Trình độ mục tiêu: A2");
    await act(async () => { oldResponse.resolve(); });
    await waitFor(() => expect(client.getQueryData(RESULT_KEY)?.targetLevel).toBe("A2"));
    expect(auth.current.user.id).toBe("learner-b");
    expect(auth.current.isAuthenticated).toBe(true);
    expect(screen.queryByText("Trình độ mục tiêu: A1")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(guidanceRegions()).toHaveLength(4);
    const resultReads = http.mock.calls.map(([config]) => config).filter((config) => config.url === RESULT_URL);
    expect(resultReads).toHaveLength(2);
    expect(resultReads[0]._sessionGeneration).toBe(oldGeneration);
    expect(resultReads[1]._sessionGeneration).toBe(getSessionGeneration());
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
  });
});
