import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ok } from "@/test/http";
import { assessmentHttp, mountAssessmentApp } from "@/features/assessment/test/assessment-app";
import { withDiscoverDirection, directionUrl } from "@/test/direction-fixtures";
import { journey, journeyUrl } from "@/features/assessment/test/attempt-fixtures";

function header() {
  return within(screen.getByRole("banner"));
}

function rejectUnexpectedRequest(config) {
  throw new Error("Unexpected Header request: " + config.url);
}

describe("authenticated learning Header IA", () => {
  it("keeps Learning and Account and places My Learning before Notifications in actions outside public navigation", () => {
    const http = assessmentHttp(rejectUnexpectedRequest);
    const { router } = mountAssessmentApp("/experiences");
    const navigation = header().getByRole("navigation", { name: "Main navigation" });
    const learning = within(navigation).getByRole("link", { name: "Learning", exact: true });
    const myLearning = header().getByRole("link", { name: "My Learning", exact: true });
    const notifications = header().getByRole("button", { name: "Notifications" });
    const account = header().getByRole("link", { name: /Account/ });

    expect(learning).toHaveAttribute("href", "/learn-german");
    expect(myLearning).toBeVisible();
    expect(myLearning).toHaveAttribute("href", "/my-learning");
    expect(account).toHaveAttribute("href", "/account");
    expect(navigation).not.toContainElement(myLearning);
    expect(Array.from(myLearning.parentElement.children)).toEqual([myLearning, notifications, account]);
    expect(myLearning.parentElement.parentElement).toBe(navigation.parentElement);
    expect(header().queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(header().queryByRole("link", { name: "Get started" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/experiences");
    expect(http).not.toHaveBeenCalled();
  });

  it("keeps anonymous Learning, Login and Get started without My Learning or Account", async () => {
    const http = assessmentHttp(rejectUnexpectedRequest);
    const { router } = mountAssessmentApp("/experiences", { anonymous: true });
    await screen.findByTestId("auth");
    expect(screen.getByTestId("auth")).toHaveTextContent("ANONYMOUS");

    expect(header().getByRole("link", { name: "Learning", exact: true })).toHaveAttribute("href", "/learn-german");
    expect(header().getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(header().getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/register");
    expect(header().queryByRole("link", { name: "My Learning", exact: true })).not.toBeInTheDocument();
    expect(header().queryByRole("link", { name: /Account/ })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/experiences");
    expect(http).not.toHaveBeenCalled();
  });

  it("uses the production router to read exactly one Journey and Direction only after an explicit My Learning click", async () => {
    const user = userEvent.setup();
    const snapshot = journey([], { currentLevel: "B1" });
    const http = assessmentHttp(withDiscoverDirection((config) => {
      if (config.url === journeyUrl) return ok(config, snapshot);
      return rejectUnexpectedRequest(config);
    }));
    const { router, client } = mountAssessmentApp("/experiences");
    const myLearning = header().getByRole("link", { name: "My Learning", exact: true });

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
      .toEqual([["get", journeyUrl, undefined], ["get", directionUrl, undefined]].sort());
    expect(client.getQueryData(["learner-learning-journey"])).toEqual(snapshot);
    expect(client.getQueryData(["my-courses"])).toBeUndefined();
    expect(client.getQueryData(["learner-competency"])).toBeUndefined();
  });
});
