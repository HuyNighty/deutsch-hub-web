import { describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContentPage from "./index";
import { groupPublishedArticles } from "./publishedSections";
import { mountSession } from "@/test/session-fixtures";
import { deferred, fail, ok, setHttpHandler } from "@/test/http";

const culture = {
  articleId: "article-culture-01",
  slug: "culture-story",
  title: "Một câu chuyện văn hóa Đức",
  summary: "Nội dung đã xuất bản",
  publishedAt: "2026-11-01T00:00:00Z",
  coverMediaId: null,
  primaryCategory: { id: "cat-culture", name: "Văn hóa" },
};
const language = {
  ...culture,
  articleId: "article-language-02",
  slug: "language-story",
  title: "Hành trình học tiếng Đức",
  primaryCategory: { id: "cat-language", name: "Ngôn ngữ" },
};

function setup(read = (config) => ok(config, {
  content: [culture, language], page: 0, size: 20, totalElements: 2, totalPages: 1,
})) {
  const http = vi.fn((config) => {
    if (config.method === "get" && config.url === "/articles") return read(config);
    throw new Error(`Unexpected Explore request: ${config.method} ${config.url}`);
  });
  setHttpHandler(http);
  const view = mountSession([
    { path: "/explore-germany", element: <ContentPage /> },
    { path: "/explore-germany/:slug", element: <p>Article destination</p> },
  ], { path: "/explore-germany", strict: false });
  return { ...view, http, user: userEvent.setup() };
}

describe("Explore Germany — published-content navigation", () => {
  it("groups only real published articles by stable category and de-duplicates IDs", () => {
    const groups = groupPublishedArticles([
      culture, language, culture,
      { ...culture, articleId: "uncategorized", slug: "other-story", primaryCategory: null },
      { ...culture, articleId: "missing-slug", slug: "" },
    ]);
    expect(groups.map((group) => [group.id, group.name, group.number, group.articles.length]))
      .toEqual([
        ["cat-culture", "Văn hóa", "01", 1],
        ["cat-language", "Ngôn ngữ", "02", 1],
        ["uncategorized", "Bài viết khác", "03", 1],
      ]);
  });

  it("navigates to rendered category sections and real published article slugs only", async () => {
    const { http, user, router } = setup();
    const cultureTitles = await screen.findAllByRole("heading", { name: culture.title });
    expect(cultureTitles.length).toBeGreaterThan(0);

    const catalogue = screen.getByRole("region", { name: "Bài viết đã xuất bản" });
    const category = catalogue.querySelector("#category-cat-culture");
    expect(category).not.toBeNull();
    expect(within(category).getByText(culture.title)).toBeVisible();

    const categoryLink = screen.getByRole("link", { name: /^Văn hóa: 1 bài viết/ });
    expect(categoryLink).toHaveAttribute("href", "#category-cat-culture");
    expect(screen.getByRole("navigation", { name: "Điều hướng bài viết" }))
      .toHaveTextContent("Ngôn ngữ");

    expect(document.querySelector('a[href^="/explore-germany/category/"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /^Đăng ký$/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email của bạn")).not.toBeInTheDocument();

    const links = within(category).getAllByRole("link", { name: new RegExp(culture.title) });
    await user.click(links[0]);
    expect(router.state.location.pathname).toBe("/explore-germany/culture-story");

    const articlesRequests = http.mock.calls.map(([config]) => [config.method, config.url]);
    expect(articlesRequests.length).toBeGreaterThanOrEqual(1);
    expect(articlesRequests.every(([method, url]) => method === "get" && url === "/articles")).toBe(true);
  });

  it("shows API-backed loading without prematurely displaying category fixtures", async () => {
    const response = deferred();
    setup((config) => response.promise.then(() => ok(config, {
      content: [culture], page: 0, size: 20, totalElements: 1, totalPages: 1,
    })));
    expect(screen.getByText("Đang tải...")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Văn hóa: 1 bài viết/ })).not.toBeInTheDocument();
    await act(async () => response.resolve());
    expect(await screen.findByRole("link", { name: /Văn hóa: 1 bài viết/ })).toBeVisible();
  });

  it("shows a truthful empty state instead of example articles or newsletter sign-up", async () => {
    setup((config) => ok(config, {
      content: [], page: 0, size: 20, totalElements: 0, totalPages: 0,
    }));
    expect(await screen.findByText("Chưa có bài viết được xuất bản")).toBeVisible();
    expect(screen.queryByText(culture.title)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email của bạn")).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="/explore-germany/category/"]')).toBeNull();
  });

  it("shows a recoverable API error and retries the same public request", async () => {
    let reads = 0;
    const { user, http } = setup((config) => ++reads === 1
      ? fail(config, 500)
      : ok(config, { content: [culture], page: 0, size: 20, totalElements: 1, totalPages: 1 }));
    await screen.findByRole("heading", { name: "Đã xảy ra lỗi" });
    expect(screen.queryByText(culture.title)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect((await screen.findAllByRole("heading", { name: culture.title })).length).toBeGreaterThan(0);
    expect(http.mock.calls.some(([config]) => config.url === "/articles")).toBe(true);
  });

  it("discloses that navigation only covers the currently loaded page", async () => {
    setup((config) => ok(config, {
      content: [culture, language], page: 0, size: 20, totalElements: 31, totalPages: 2,
    }));
    expect(await screen.findByText(/Đang hiển thị 2 \/ 31 bài viết được xuất bản/)).toBeVisible();
    expect(screen.getByText(/Các danh mục bên trên chỉ phản ánh những bài đang hiển thị/)).toBeVisible();
  });
});
