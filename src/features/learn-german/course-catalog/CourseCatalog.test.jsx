import { describe, expect, it, vi } from "vitest";
import { focusManager, onlineManager } from "@tanstack/react-query";
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

  it("searches the published dataset on the server, including courses not in page zero", async () => {
    const remote = {
      ...catalogCourses[0], id: "remote-catalogue-id",
      title: "Fernstudium B1", description: "Published course outside page zero.",
    };
    const { http, user } = setup({
      read: (config) => ok(config, {
        items: config.params?.keyword === "Fern" ? [remote] : catalogCourses,
        page: 0, size: 20, totalElements: config.params?.keyword ? 1 : 2, totalPages: 1,
      }),
    });
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    await within(list).findAllByRole("article");
    await user.type(screen.getByRole("searchbox", { name: "Tìm khóa học" }), "Fern");
    expect(await within(list).findByText(remote.title)).toBeVisible();
    expect(within(list).queryByText(catalogCourses[0].title)).not.toBeInTheDocument();
    expect(http.mock.calls.some(([config]) =>
      config.method === "get" && config.url === "/courses" &&
      config.params?.keyword === "Fern" && config.params?.page === 0 &&
      config.params?.size === 20,
    )).toBe(true);
    expect(requests(http).every(([method]) => method === "get")).toBe(true);
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
  it("loads the next page on request and deduplicates stable course IDs", async () => {
    const extra = {
      ...catalogCourses[0], id: "page-two-course", title: "Gespräche B1",
      description: "Another published course.", level: "B1",
    };
    const { http, user } = setup({
      read: (config) => ok(config, config.params?.page === 1
        ? { items: [extra, catalogCourses[0]], page: 1, size: 20, totalElements: 3, totalPages: 2 }
        : { items: catalogCourses, page: 0, size: 20, totalElements: 3, totalPages: 2 }),
    });
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    expect(await within(list).findAllByRole("article")).toHaveLength(2);
    expect(http.mock.calls.every(([config]) => config.params?.page === 0)).toBe(true);
    await user.click(screen.getByRole("button", { name: "Tải thêm khóa học" }));
    expect(await within(list).findByText(extra.title)).toBeVisible();
    const cards = within(list).getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => within(card).getByRole("heading").textContent))
      .toEqual([...catalogCourses.map((course) => course.title), extra.title]);
    expect(within(list).getByRole("status")).toHaveTextContent("3 hiển thị · 3/3 khóa học đã tải");
    expect(screen.queryByRole("button", { name: "Tải thêm khóa học" })).not.toBeInTheDocument();
    expect(http.mock.calls.some(([config]) =>
      config.method === "get" && config.url === "/courses" && config.params?.page === 1,
    )).toBe(true);
    expect(requests(http).every(([method]) => method === "get")).toBe(true);
  });

  it("preserves the loaded cards when a later page fails and retries only after user action", async () => {
    const extra = {
      ...catalogCourses[0], id: "retry-page-course", title: "Wortschatz B1", level: "B1",
    };
    let laterReads = 0;
    const { user, http } = setup({
      read: (config) => config.params?.page === 1
        ? (++laterReads === 1 ? fail(config, 500) :
          ok(config, { items: [extra], page: 1, size: 20, totalElements: 3, totalPages: 2 }))
        : ok(config, { items: catalogCourses, page: 0, size: 20, totalElements: 3, totalPages: 2 }),
    });
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    expect(await within(list).findAllByRole("article")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Tải thêm khóa học" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được trang tiếp theo");
    expect(within(list).getAllByRole("article")).toHaveLength(2);
    expect(laterReads).toBe(1);
    await user.click(screen.getByRole("button", { name: "Thử tải lại" }));
    expect(await within(list).findByText(extra.title)).toBeVisible();
    expect(within(list).getAllByRole("article")).toHaveLength(3);
    expect(laterReads).toBe(2);
    expect(requests(http).every(([method]) => method === "get")).toBe(true);
  });


  it("does not reload the page stack on refocus or reconnection", async () => {
    const extra = {
      ...catalogCourses[0], id: "focus-regression-course",
      title: "Tandem Deutsch B1",
    };
    const { http, user } = setup({
      read: (config) => ok(config, config.params?.page === 1
        ? { items: [extra], page: 1, size: 20, totalElements: 3, totalPages: 2 }
        : { items: catalogCourses, page: 0, size: 20, totalElements: 3, totalPages: 2 }),
    });

    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    expect(await within(list).findAllByRole("article")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Tải thêm khóa học" }));
    expect(await within(list).findByText(extra.title)).toBeVisible();

    const before = requests(http).filter(([method, url]) => method === "get" && url === "/courses");
    try {
      await act(async () => {
        focusManager.setFocused(false);
        onlineManager.setOnline(false);
      });
      await act(async () => {
        focusManager.setFocused(true);
        onlineManager.setOnline(true);
        await Promise.resolve();
      });
      expect(requests(http).filter(([method, url]) =>
        method === "get" && url === "/courses")).toEqual(before);
      expect(within(list).getAllByRole("article")).toHaveLength(3);
    } finally {
      focusManager.setFocused(undefined);
      onlineManager.setOnline(undefined);
    }
  });

  it("does not claim a filtered level is absent while more pages remain", async () => {
    const { user } = setup({
      read: (config) => ok(config, config.params?.page === 1
        ? { items: [catalogCourses[0]], page: 1, size: 20, totalElements: 2, totalPages: 2 }
        : { items: [catalogCourses[1]], page: 0, size: 20, totalElements: 2, totalPages: 2 }),
    });
    const list = await screen.findByRole("region", { name: "Danh sách khóa học" });
    expect(await within(list).findAllByRole("article")).toHaveLength(1);
    await user.selectOptions(screen.getByRole("combobox", { name: "Lọc trình độ" }), "A1");
    expect(within(list).getByText("Chưa thấy khóa học phù hợp trong dữ liệu đã tải")).toBeVisible();
    expect(screen.getByText("Lọc trình độ và sắp xếp chỉ áp dụng cho các khóa học đã tải.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Tải thêm khóa học" }));
    expect(await within(list).findByText(catalogCourses[0].title)).toBeVisible();
  });

});
