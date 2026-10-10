import { describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { router as productionRouter } from "@/app/router/routes";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";
import { catalogCourses, courseViewer } from "./test/course-fixtures";

function setup({ read = (config) => ok(config, { items: catalogCourses }), anonymous = false } = {}) {
  if (!anonymous) seedSession();
  const http = vi.fn((config) => {
    if (config.method === "get" && config.url === "/courses") return read(config);
    if (config.method === "get" && config.url === `/courses/${courseViewer.id}/viewer`) return ok(config, courseViewer);
    throw new Error(`Unexpected discovery request: ${config.method} ${config.url}`);
  });
  setHttpHandler(http);
  return { ...mountSession(productionRouter.routes, { path: "/learn-german" }), http, user: userEvent.setup() };
}

const requests = (http) => http.mock.calls.map(([config]) => [config.method, config.url]);

describe("Vietnamese Course Catalog with the production router", () => {
  it.each([false, true])("preserves authored content, order, CEFR, duration and prices (anonymous=%s)", async (anonymous) => {
    const { http } = setup({ anonymous });
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    const main = list.closest("main");
    expect(main).toHaveAttribute("lang", "vi");
    expect(within(main).getByText("HỌC TẬP")).toBeVisible();
    expect(within(main).getByRole("heading", { name: /^Học tiếng Đức\s*theo lộ trình bài bản\.$/ })).toBeVisible();
    const cards = within(list).getAllByRole("article");
    expect(cards.map((card) => within(card).getByRole("heading").textContent)).toEqual(catalogCourses.map((course) => course.title));
    for (const [index, course] of catalogCourses.entries()) {
      expect(within(cards[index]).getByText(course.description)).toBeVisible();
      expect(within(cards[index]).getByText(course.level)).toBeVisible();
      expect(within(cards[index]).getByText(`${course.estimatedHours} giờ`)).toBeVisible();
      expect(within(cards[index]).getByRole("link", { name: /Xem khóa học/ })).toHaveAttribute("href", `/learn-german/courses/${course.id}`);
    }
    expect(within(cards[0]).getByText("1.234.567 ₫")).toBeVisible();
    expect(within(cards[1]).getByText("99.5 USD")).toBeVisible();
    const path = within(main).getByLabelText("Các cấp độ tiếng Đức từ A1 đến C2");
    expect(within(path).getAllByText(/^[ABC][12]$/).map((node) => node.textContent)).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
    expect(within(path).getByText("A1").className).toMatch(/active/);
    expect(within(path).getByText("B2").className).not.toMatch(/active/);
    expect(requests(http).every(([method, url]) => method === "get" && url === "/courses")).toBe(true);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("follows the exact Course Detail link by keyboard without an enrollment mutation", async () => {
    const { user, router, http } = setup();
    const links = await screen.findAllByRole("link", { name: /Xem khóa học/ });
    links[0].focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("button", { name: "Đăng ký khóa học", exact: true });
    expect(router.state.location.pathname).toBe(`/learn-german/courses/${courseViewer.id}`);
    expect(screen.getByRole("heading", { name: courseViewer.title, level: 1 })).toBeVisible();
    expect(requests(http)).toEqual([["get", "/courses"], ["get", `/courses/${courseViewer.id}/viewer`]]);
  });

  it("preserves loading until the Catalog read completes", async () => {
    const response = deferred();
    const { http } = setup({ read: (config) => response.promise.then(() => ok(config, { items: catalogCourses })) });
    expect(screen.getByText("Đang tải...")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Xem khóa học/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Không tìm thấy khóa học")).not.toBeInTheDocument();
    await act(async () => response.resolve());
    expect(await screen.findAllByRole("link", { name: /Xem khóa học/ })).toHaveLength(2);
    expect(requests(http)).toEqual([["get", "/courses"]]);
  });

  it("renders Vietnamese empty copy without inventing courses or navigation", async () => {
    const { http } = setup({ read: (config) => ok(config, { items: [] }) });
    const heading = await screen.findByRole("heading", { name: "Không tìm thấy khóa học" });
    expect(within(heading).getByText("Không tìm thấy khóa học")).toHaveAttribute("lang", "vi");
    expect(screen.getByText("Hiện chưa có khóa học nào.")).toHaveAttribute("lang", "vi");
    expect(screen.queryByRole("region", { name: "Danh sách khóa học" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Xem khóa học/ })).not.toBeInTheDocument();
    expect(requests(http)).toEqual([["get", "/courses"]]);
  });

  it("retains the existing shared error and explicit read retry", async () => {
    let reads = 0;
    const { user, http } = setup({ read: (config) => ++reads === 1 ? fail(config, 500) : ok(config, { items: catalogCourses }) });
    await screen.findByRole("heading", { name: "Đã xảy ra lỗi" });
    expect(screen.queryByRole("link", { name: /Xem khóa học/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findAllByRole("link", { name: /Xem khóa học/ })).toHaveLength(2);
    expect(requests(http)).toEqual([["get", "/courses"], ["get", "/courses"]]);
  });
});
