import { withNoActivity, nextActivityUrl } from "@/test/next-activity-fixtures";
import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { withDiscoverDirection, directionUrl } from "@/test/direction-fixtures";
import { journey, journeyUrl } from "@/features/assessment/test/attempt-fixtures";
import { assessmentPage } from "@/features/assessment/test/fixtures";
import styles from "./Header.module.scss";

function header() {
  return within(screen.getByRole("banner"));
}

function rejectUnexpectedRequest(config) {
  throw new Error("Unexpected Header request: " + config.url);
}

describe("authenticated learning Header IA", () => {
  it("preserves public navigation and orders My Learning, Assessments, Notifications and Account outside it", () => {
    const http = assessmentHttp(rejectUnexpectedRequest);
    const { router } = mountAssessmentApp("/experiences");
    const navigation = header().getByRole("navigation", { name: "Điều hướng chính" });
    const learning = within(navigation).getByRole("link", { name: "Học tiếng Đức", exact: true });
    const myLearning = header().getByRole("link", { name: "Học tập của tôi", exact: true });
    const assessments = header().getByRole("link", { name: "Bài đánh giá", exact: true });
    const notifications = header().getByRole("button", { name: "Thông báo" });
    const account = header().getByRole("link", { name: "Tài khoản" });

    expect(screen.getByRole("banner")).toHaveAttribute("lang", "vi");
    expect(header().getByRole("link", { name: "Trang chủ DeutschHub" })).toHaveAttribute("href", "/");
    expect(account).toHaveAttribute("aria-label", "Tài khoản");
    expect(learning).toHaveAttribute("href", "/learn-german");
    expect(within(navigation).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]))
      .toEqual([["Học tiếng Đức", "/learn-german"], ["Khám phá nước Đức", "/explore-germany"],
        ["Du học Đức", "/study-in-germany"], ["Giao lưu", "/experiences"]]);
    expect(myLearning).toBeVisible();
    expect(myLearning).toHaveAttribute("href", "/my-learning");
    expect(assessments).toBeVisible();
    expect(assessments).toHaveAttribute("href", "/my-learning/assessments");
    expect(account).toHaveAttribute("href", "/account");
    expect(navigation).not.toContainElement(myLearning);
    expect(navigation).not.toContainElement(assessments);
    expect(Array.from(myLearning.parentElement.children)).toEqual([myLearning, assessments, notifications, account]);
    expect(myLearning.parentElement.parentElement).toBe(navigation.parentElement);
    expect(header().queryByRole("link", { name: "Đăng nhập" })).not.toBeInTheDocument();
    expect(header().queryByRole("link", { name: "Đăng ký" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/experiences");
    expect(http).not.toHaveBeenCalled();
  });

  it("keeps the localized Notifications control inactive", async () => {
    const http = assessmentHttp(rejectUnexpectedRequest);
    const { router, client } = mountAssessmentApp("/experiences");
    await userEvent.setup().click(header().getByRole("button", { name: "Thông báo" }));
    expect(router.state.location.pathname).toBe("/experiences");
    expect(http).not.toHaveBeenCalled();
    expect(client.getMutationCache().getAll()).toEqual([]);
  });

  it("keeps anonymous public navigation, Login and Get started without authenticated actions", async () => {
    const http = assessmentHttp(rejectUnexpectedRequest);
    const { router } = mountAssessmentApp("/experiences", { anonymous: true });
    await screen.findByTestId("auth");
    expect(screen.getByTestId("auth")).toHaveTextContent("ANONYMOUS");

    expect(header().getByRole("link", { name: "Học tiếng Đức", exact: true })).toHaveAttribute("href", "/learn-german");
    expect(within(header().getByRole("navigation", { name: "Điều hướng chính" })).getAllByRole("link").map((link) => link.textContent))
      .toEqual(["Học tiếng Đức", "Khám phá nước Đức", "Du học Đức", "Giao lưu"]);
    expect(header().getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
    expect(header().getByRole("link", { name: "Đăng ký" })).toHaveAttribute("href", "/register");
    expect(header().queryByRole("link", { name: "Học tập của tôi", exact: true })).not.toBeInTheDocument();
    expect(header().queryByRole("link", { name: "Bài đánh giá", exact: true })).not.toBeInTheDocument();
    expect(header().queryByRole("button", { name: "Thông báo" })).not.toBeInTheDocument();
    expect(header().queryByRole("link", { name: "Tài khoản" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/experiences");
    expect(http).not.toHaveBeenCalled();
  });

  it("uses the production router to read exactly one Journey, Direction and Next Activity only after an explicit My Learning click", async () => {
    const user = userEvent.setup();
    const snapshot = journey([], { currentLevel: "B1" });
    const http = assessmentHttp(withNoActivity(withDiscoverDirection((config) => {
      if (config.url === journeyUrl) return ok(config, snapshot);
      return rejectUnexpectedRequest(config);
    })));
    const { router, client } = mountAssessmentApp("/experiences");
    const myLearning = header().getByRole("link", { name: "Học tập của tôi", exact: true });

    expect(myLearning).toBeVisible();
    expect(router.state.location.pathname).toBe("/experiences");
    expect(http).not.toHaveBeenCalled();
    expect(client.getQueryData(["learner-learning-journey"])).toBeUndefined();

    await user.click(myLearning);
    const level = await screen.findByRole("region", { name: "Current German level" });
    expect(within(level).getByText("B1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My Learning", level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/my-learning");
    expect(http.mock.calls.map(([config]) => [config.method, config.url, config.data]).sort())
      .toEqual([["get", journeyUrl, undefined], ["get", directionUrl, undefined], ["get", nextActivityUrl, undefined]].sort());
    expect(client.getQueryData(["learner-learning-journey"])).toEqual(snapshot);
    expect(client.getQueryData(["my-courses"])).toBeUndefined();
    expect(client.getQueryData(["learner-competency"])).toBeUndefined();
  });

  it.each(["/experiences", "/"])("opens the production Assessment Catalog from %s with only its expected read", async (path) => {
    const user = userEvent.setup();
    const catalog = assessmentPage();
    const http = assessmentHttp((config) => {
      if (config.url === "/articles") return ok(config, { content: [], totalElements: 0 });
      if (config.url === "/me/assessments") return ok(config, catalog);
      return rejectUnexpectedRequest(config);
    });
    const { router, client } = mountAssessmentApp(path);
    if (path === "/") await screen.findByText("No published content available.");
    // Home retains its existing public content read; the Header adds no requests.
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(path === "/" ? ["/articles"] : []);
    expect(client.getQueryData(["learner-learning-journey"])).toBeUndefined();
    const assessments = header().getByRole("link", { name: "Bài đánh giá", exact: true });
    expect(assessments).toHaveAttribute("href", "/my-learning/assessments");
    await user.click(assessments);
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    expect(screen.getByRole("heading", { name: "Assessments", level: 1 })).toBeVisible();
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
    const reads = http.mock.calls.map(([config]) => config).filter((config) => config.url === "/me/assessments");
    expect(reads).toHaveLength(1);
    expect(reads[0]).toMatchObject({ method: "get", params: { page: 0, size: 20 }, data: undefined });
    expect(http.mock.calls.every(([config]) => config.method === "get")).toBe(true);
    expect(client.getQueryData(["learner-assessments", { page: 0, size: 20 }])).toEqual(catalog);
    expect(client.getQueryData(["learner-learning-journey"])).toBeUndefined();
    expect(client.getMutationCache().getAll()).toEqual([]);
    expect(screen.queryByRole("button", { name: "Start Assessment" })).not.toBeInTheDocument();
  });

  it("supports keyboard discovery and activation without reading or mutating until Enter", async () => {
    const user = userEvent.setup();
    const http = assessmentHttp((config) => config.url === "/me/assessments"
      ? ok(config, assessmentPage()) : rejectUnexpectedRequest(config));
    const { router, client } = mountAssessmentApp("/experiences");
    for (const name of ["Trang chủ DeutschHub", "Học tiếng Đức", "Khám phá nước Đức", "Du học Đức", "Giao lưu", "Học tập của tôi", "Bài đánh giá"]) {
      await user.tab();
      expect(header().getByRole("link", { name, exact: true })).toHaveFocus();
    }
    expect(http).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    await screen.findByRole("heading", { name: "B1 Placement Assessment" });
    expect(router.state.location.pathname).toBe("/my-learning/assessments");
    expect(http.mock.calls.map(([config]) => [config.method, config.url])).toEqual([["get", "/me/assessments"]]);
    expect(client.getMutationCache().getAll()).toEqual([]);
  });

  it("keeps direct anonymous catalog access behind Login with the complete returnTo and no reads", async () => {
    const http = assessmentHttp(rejectUnexpectedRequest);
    const path = "/my-learning/assessments?source=header#catalog";
    const { router } = mountAssessmentApp(path, { anonymous: true });
    await screen.findByRole("button", { name: /Login to DeutschHub/ });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: path });
    expect(http).not.toHaveBeenCalled();
  });

  it("preserves Home hero overlay, scroll/resize threshold and solid Header after route navigation", async () => {
    let heroBottom = 600;
    const originalBounds = Element.prototype.getBoundingClientRect;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function () {
      return this.matches("[data-header-hero]") ? { bottom: heroBottom } : originalBounds.call(this);
    });
    const http = assessmentHttp((config) => config.url === "/articles"
      ? ok(config, { content: [], totalElements: 0 }) : rejectUnexpectedRequest(config));
    const { router } = mountAssessmentApp("/");
    await screen.findByText("No published content available.");
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass(styles.overlay);
    expect(banner).not.toHaveClass(styles.solid);
    heroBottom = 72;
    fireEvent.scroll(window);
    expect(banner).toHaveClass(styles.solid);
    heroBottom = 73;
    fireEvent.resize(window);
    expect(banner).toHaveClass(styles.overlay);
    const removeListener = vi.spyOn(window, "removeEventListener");
    await act(async () => { await router.navigate("/experiences"); });
    expect(banner).toHaveClass(styles.solid);
    expect(banner).not.toHaveClass(styles.overlay);
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(http.mock.calls.map(([config]) => config.url)).toEqual(["/articles"]);
  });
});
