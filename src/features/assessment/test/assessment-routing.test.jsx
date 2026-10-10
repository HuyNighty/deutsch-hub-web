import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { loginResult } from "@/test/session-fixtures";
import { ok } from "@/test/http";
import { emptyJourneyHttp as assessmentHttp, mountAssessmentApp } from "./assessment-app";
import { assessmentPage, assessmentDetail, ASSESSMENT_ID } from "./fixtures";

describe("Assessment discovery protected routing", () => {
  it.each([
    ["/my-learning/assessments", "Assessments"],
    [`/my-learning/assessments/${ASSESSMENT_ID}`, "B1 Placement Assessment"],
  ])("returns an anonymous learner from Login to %s using the production guards", async (path, heading) => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => {
      if (config.url === "/auth/login") return ok(config, loginResult());
      if (config.url === "/me/assessments") return ok(config, assessmentPage());
      if (config.url === `/me/assessments/${ASSESSMENT_ID}`) return ok(config, assessmentDetail());
      throw new Error(`Unexpected request: ${config.url}`);
    });
    const { router } = mountAssessmentApp(path, { anonymous: true });
    await screen.findByRole("button", { name: /Đăng nhập vào DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: path });
    expect(http).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Tên đăng nhập hoặc email"), "learner");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: /Đăng nhập vào DeutschHub/ }));
    await screen.findByRole("heading", { name: heading, level: 1 });
    // The Catalog title is static; wait for returned content before asserting its read.
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    expect(router.state.location.pathname).toBe(path);
    expect(http.mock.calls.map(([config]) => config.url)).toEqual([
      "/auth/login", path.replace("/my-learning", "/me"),
      ...(path === "/my-learning/assessments" ? [] : ["/me/learning-journey"]),
    ]);
  });
});
