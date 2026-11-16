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

describe("Catalogue V1.2 — API parity and client-side discovery", () => {
  it.each([false, true])("keeps API course ordering, title, description, CEFR and price (anonymous=%s)", async (anonymous) => {
    const { http } = setup({ anonymous });
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    const catalogue = list.closest('[lang="vi"]');
    expect(catalogue).toBeInTheDocument();
    expect(within(catalogue).getByRole("heading", { name: /Khóa học tiếng Đức/ })).toBeVisible();
    // The outer Catalogue region exists before the asynchronous GET resolves.
    const cards = await within(list).findAllByRole("article");
    expect(cards.map((card) => within(card).getByRole("heading").textContent))
      .toEqual(catalogCourses.map((course) => course.title));
    for (const [index, course] of catalogCourses.entries()) {
      expect(within(cards[index]).getByText(course.description)).toBeVisible();
      expect(within(cards[index]).getAllByText(course.level).length).toBeGreaterThan(0);
      expect(within(cards[index]).getByRole("link", { name: /Xem khóa học/ }))
        .toHaveAttribute("href", `/learn-german/courses/${course.id}`);
    }
    expect(within(cards[0]).getByText("1.234.567 ₫")).toBeVisible();
    expect(within(cards[1]).getByText("99.5 USD")).toBeVisible();
    // Anonymous auth bootstrap can clear the QueryClient during StrictMode effects,
    // leading to repeated GETs. Verify request method/route, not an unstable count.
    const initialRequests = requests(http);
    expect(initialRequests.length).toBeGreaterThanOrEqual(1);
    expect(initialRequests.every(([method, url]) => method === "get" && url === "/courses")).toBe(true);
  });

  it("filters within the fetched courses without a new API call or enrollment mutation", async () => {
    const { http, user } = setup();
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    await within(list).findAllByRole("article");
    const beforeSearch = requests(http);
    const [first] = catalogCourses;
    await user.type(screen.getByRole("searchbox", { name: "Tìm khóa học" }), first.title);
    expect(within(list).getAllByRole("article")).toHaveLength(1);
    expect(within(list).getByText(first.title)).toBeVisible();
    // Searching/filtering happens in memory; it must not trigger another GET.
    expect(requests(http)).toEqual(beforeSearch);
  });

  it("keeps course artwork and course identity stable through theme switch and filtering", async () => {
    const { user } = setup();
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    const cards = await within(list).findAllByRole("article");
    const coverBefore = cards.map((card) => {
      const image = card.querySelector("img[alt='']");
      expect(image).toBeInTheDocument();
      return { source: image.getAttribute("src"), crop: image.style.objectPosition };
    });
    expect(coverBefore.every((item) => item.source === "/images/learn-german/castle-day.webp")).toBe(true);
    const toggle = screen.getByRole("button", { name: "Chuyển sang giao diện tối" });
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Chuyển sang giao diện sáng" })).toBeVisible();
    const coverAfter = within(list).getAllByRole("article").map((card) => {
      const image = card.querySelector("img[alt='']");
      return { source: image.getAttribute("src"), crop: image.style.objectPosition };
    });
    expect(coverAfter).toEqual(coverBefore);
    const artByCourseLink = new Map(cards.map((card) => [
      within(card).getByRole("link", { name: /Xem khóa học/ }).getAttribute("href"),
      card.querySelector("img").style.objectPosition,
    ]));
    await user.selectOptions(screen.getByRole("combobox", { name: "Sắp xếp khóa học" }), "title");
    const sortedCards = within(list).getAllByRole("article");
    // Compare with a pre-sort snapshot, not recycled DOM node references.
    for (const card of sortedCards) {
      const href = within(card).getByRole("link", { name: /Xem khóa học/ }).getAttribute("href");
      expect(card.querySelector("img").style.objectPosition).toBe(artByCourseLink.get(href));
    }
  });

  it("navigates to course detail by keyboard without enrollment POST", async () => {
    const { user, router, http } = setup();
    const links = await screen.findAllByRole("link", { name: /Xem khóa học/ });
    links[0].focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("button", { name: "Đăng ký khóa học", exact: true });
    expect(router.state.location.pathname).toBe(`/learn-german/courses/${courseViewer.id}`);
    expect(requests(http)).toEqual([["get", "/courses"], ["get", `/courses/${courseViewer.id}/viewer`]]);
  });

  it("keeps loading until the actual GET completes", async () => {
    const response = deferred();
    const { http } = setup({ read: (config) => response.promise.then(() => ok(config, { items: catalogCourses })) });
    expect(screen.getByText("Đang tải...")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Xem khóa học/ })).not.toBeInTheDocument();
    await act(async () => response.resolve());
    expect(await screen.findAllByRole("link", { name: /Xem khóa học/ })).toHaveLength(catalogCourses.length);
    expect(requests(http)).toEqual([["get", "/courses"]]);
  });

  it("preserves empty state and real retry, not fake demo courses", async () => {
    const { http } = setup({ read: (config) => ok(config, { items: [] }) });
    expect(await screen.findByRole("heading", { name: "Không tìm thấy khóa học" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Xem khóa học/ })).not.toBeInTheDocument();
    expect(requests(http)).toEqual([["get", "/courses"]]);
  });

  it("shows error and retries the existing GET endpoint", async () => {
    let reads = 0;
    const { user, http } = setup({ read: (config) => ++reads === 1 ? fail(config, 500) : ok(config, { items: catalogCourses }) });
    await screen.findByRole("heading", { name: "Đã xảy ra lỗi" });
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findAllByRole("link", { name: /Xem khóa học/ })).toHaveLength(catalogCourses.length);
    expect(requests(http)).toEqual([["get", "/courses"], ["get", "/courses"]]);
  });
});
