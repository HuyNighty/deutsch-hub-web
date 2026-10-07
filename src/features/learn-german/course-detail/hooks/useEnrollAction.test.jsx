import { afterEach, describe, it, expect, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { fail, ok, setHttpHandler } from "@/test/http";
import { COURSE_ID, seedCourseState, expectCourseState } from "@/test/course-state-fixtures";
import { learningJourneyKey } from "@/features/assessment/attempt/hooks/useLearningJourney";
import { useEnrollAction } from "./useEnrollAction";

const publicPath = `/learn-german/courses/${COURSE_ID}`;
const coursePath = `/my-learning/courses/${COURSE_ID}`;
const enrollUrl = `/courses/${COURSE_ID}/enroll`;

function Enroll() {
  const { handleEnroll } = useEnrollAction(COURSE_ID);
  return <button onClick={handleEnroll}>Enroll</button>;
}
const routes = [
  { path: publicPath, element: <Enroll /> },
  { path: coursePath, element: <div>Course destination</div> },
  { path: "/login", element: <div>Login destination</div> },
];
afterEach(() => { vi.restoreAllMocks(); });

describe("Enroll Course cache coherence", () => {
  it("invalidates only exact Journey and the existing Course family without patching or fetching Journey, then navigates", async () => {
    seedSession();
    const cache = seedCourseState();
    const http = vi.fn((config) => {
      expect(config.url).toBe(enrollUrl);
      expect(config.method).toBe("post");
      expect(config.data).toBeUndefined();
      return ok(config, { courseId: COURSE_ID, enrollmentStatus: "ENROLLED" });
    });
    setHttpHandler(http);
    const { router } = mountSession(routes, { path: publicPath, client: cache.client });
    expect(http).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Enroll" }));
    await screen.findByText("Course destination");
    expectCourseState(cache, true);
    expect(router.state.location.pathname).toBe(coursePath);
    expect(router.state.historyAction).toBe("REPLACE");
    expect(http.mock.calls.map(([config]) => [config.method, config.url])).toEqual([["post", enrollUrl]]);
  });

  it("keeps Journey and Course caches fresh on failure and preserves the enrollment alert without navigating", async () => {
    seedSession();
    const cache = seedCourseState();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const http = vi.fn((config) => fail(config, 500));
    setHttpHandler(http);
    const { router } = mountSession(routes, { path: publicPath, client: cache.client });
    await userEvent.setup().click(screen.getByRole("button", { name: "Enroll" }));
    await waitFor(() => expect(alert).toHaveBeenCalledWith("Enroll failed"));
    expectCourseState(cache);
    expect(router.state.location.pathname).toBe(publicPath);
    expect(http.mock.calls.map(([config]) => [config.method, config.url])).toEqual([["post", enrollUrl]]);
  });

  it("redirects anonymous enrollment to Login with the selected Course returnTo and no mutation, invalidation or learner cache", async () => {
    const http = vi.fn(() => { throw new Error("No anonymous enrollment request"); });
    setHttpHandler(http);
    const { router, client } = mountSession(routes, { path: publicPath });
    await act(async () => {});
    expect(screen.getByTestId("auth")).toHaveTextContent("ANONYMOUS");
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await userEvent.setup().click(screen.getByRole("button", { name: "Enroll" }));
    await screen.findByText("Login destination");
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ returnTo: publicPath });
    expect(invalidate).not.toHaveBeenCalled();
    expect(client.getQueryData(learningJourneyKey)).toBeUndefined();
    expect(client.getQueryCache().getAll()).toEqual([]);
    expect(http).not.toHaveBeenCalled();
  });
});
