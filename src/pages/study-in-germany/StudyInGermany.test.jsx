import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import StudyInGermany from "./index";
import { router } from "@/app/router/routes";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { setHttpHandler } from "@/test/http";
import { studyContent } from "@/features/study-in-germany/content/studyContent";

const units = [
  ["higher-education", "Học đại học tại Đức"],
  ["vocational-training", "Ausbildung: Khám phá đào tạo nghề tại Đức"],
  ["dual-studies", "Duales Studium: Khi học đại học kết hợp thực hành"],
  ["how-i-want-to-learn", "Bạn muốn học theo cách nào?"],
  ["learning-and-working", "Vừa học vừa làm có phải lúc nào cũng giống nhau?"],
];
const sessions = [];
const originalScroll = HTMLElement.prototype.scrollIntoView;
beforeEach(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(() => {
  for (const session of sessions.splice(0)) {
    session.unmount();
    session.router.dispose();
    session.client.clear();
  }
  if (originalScroll) HTMLElement.prototype.scrollIntoView = originalScroll;
  else delete HTMLElement.prototype.scrollIntoView;
});

function renderStudy() {
  return render(<MemoryRouter initialEntries={["/study-in-germany" + window.location.hash]}>
    <StudyInGermany />
  </MemoryRouter>);
}

describe("Study in Germany approved public content", () => {
  it("owns document metadata on direct StrictMode entry and restores preceding values on exit", () => {
    const language = document.documentElement.lang;
    const title = document.title;
    document.documentElement.lang = "en";
    document.title = "Previous collection";
    try {
      const view = render(<StrictMode><MemoryRouter><StudyInGermany /></MemoryRouter></StrictMode>);
      expect(document.documentElement.lang).toBe("vi");
      expect(document.title).toBe(studyContent.introduction.title + " | DeutschHub");
      expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
      view.unmount();
      expect(document.documentElement.lang).toBe("en");
      expect(document.title).toBe("Previous collection");
    } finally {
      document.documentElement.lang = language;
      document.title = title;
    }
  });

  it("focuses explicit no-hash PUSH entries including same-route navigation, preserves POP and cleans metadata", async () => {
    const language = document.documentElement.lang;
    const title = document.title;
    const localRouter = createMemoryRouter([
      { path: "/", element: <h1>Previous page</h1> },
      { path: "/study-in-germany", element: <StudyInGermany /> },
    ]);
    const view = render(<StrictMode><RouterProvider router={localRouter} /></StrictMode>);
    const scroll = HTMLElement.prototype.scrollIntoView;
    try {
      await act(async () => { await localRouter.navigate("/study-in-germany"); });
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveFocus();
      expect(scroll).toHaveBeenCalledWith({ block: "start", behavior: "instant" });
      scroll.mockClear();
      heading.blur();
      await act(async () => { await localRouter.navigate("/study-in-germany"); });
      expect(heading).toHaveFocus();
      expect(scroll).toHaveBeenCalledTimes(1);
      scroll.mockClear();
      await act(async () => { await localRouter.navigate("/study-in-germany#dual-studies"); });
      expect(scroll).not.toHaveBeenCalled();
      heading.blur();
      await act(async () => { await localRouter.navigate(-1); });
      expect(scroll).not.toHaveBeenCalled();
      expect(heading).not.toHaveFocus();
      await act(async () => { await localRouter.navigate("/"); });
      expect(document.documentElement.lang).toBe(language);
      expect(document.title).toBe(title);
    } finally {
      view.unmount();
      localRouter.dispose();
    }
  });

  it.each(units)("opens guest fragment %s on the production route without a request", async (id, title) => {
    const http = vi.fn(() => { throw new Error("Public study content must not request an API"); });
    setHttpHandler(http);
    const session = mountSession(router.routes, { path: "/study-in-germany#" + id });
    sessions.push(session);
    await screen.findByText("ANONYMOUS", { exact: false });
    expect(screen.getByRole("heading", { name: title, level: 2 })).toHaveAttribute("id", id);
    expect(session.router.state.location.pathname).toBe("/study-in-germany");
    expect(session.router.state.location.hash).toBe("#" + id);
    expect(http).not.toHaveBeenCalled();
    expect(session.client.getMutationCache().getAll()).toEqual([]);
  });

  it("preserves authenticated public access and the existing Header destination", async () => {
    seedSession();
    const http = vi.fn(() => { throw new Error("Unexpected public content request"); });
    setHttpHandler(http);
    const session = mountSession(router.routes, { path: "/study-in-germany" });
    sessions.push(session);
    await screen.findByText("AUTHENTICATED", { exact: false });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Khám phá con đường học tập tại Đức");
    expect(within(screen.getByRole("banner")).getByRole("link", { name: "Du học Đức", exact: true })).toHaveAttribute("href", "/study-in-germany");
    expect(http).not.toHaveBeenCalled();
  });

  it("uses the AppShell main once and marks the local Vietnamese content", () => {
    const session = mountSession(router.routes, { path: "/study-in-germany" });
    sessions.push(session);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).closest('[lang="vi"]')).toBeInTheDocument();
    expect(screen.getAllByRole("region").filter(region => region.tagName === "SECTION")).toHaveLength(5);
    expect(document.querySelectorAll("main main")).toHaveLength(0);
  });

  it("provides path-first and question-first entrances with all approved targets", () => {
    renderStudy();
    const paths = screen.getByRole("navigation", { name: "Khám phá theo con đường học tập" });
    const questions = screen.getByRole("navigation", { name: "Khám phá từ câu hỏi" });
    expect(within(paths).getAllByRole("link").map(link => link.hash)).toEqual(units.slice(0, 3).map(([id]) => "#" + id));
    expect(within(questions).getAllByRole("link").map(link => link.hash)).toEqual(units.slice(3).map(([id]) => "#" + id));
    for (const link of document.querySelectorAll('a[href^="#"]')) {
      expect(document.getElementById(link.hash.slice(1))).toHaveAttribute("tabindex", "-1");
    }
  });

  it("keeps question-first discovery static and introduces no response collection", () => {
    renderStudy();
    const question = screen.getByRole("region", { name: "Bạn muốn học theo cách nào?" });
    expect(within(question).getAllByRole("listitem").some(item => item.textContent === "Mình muốn hiểu sâu lĩnh vực nào?")).toBe(true);
    expect(within(question).getByText("Bạn không cần gửi câu trả lời nào cho DeutschHub. Đây chỉ là những câu hỏi để bạn tự suy ngẫm và lựa chọn điều muốn tìm hiểu tiếp.")).toBeInTheDocument();
    expect(document.querySelectorAll("form, input, select, textarea, button")).toHaveLength(0);
    expect(document.body).not.toHaveTextContent("Q03");
    expect(document.body).not.toHaveTextContent("Q07");
  });

  it("retains qualifications about overlapping forms and programme-dependent outcomes", () => {
    renderStudy();
    expect(screen.getByText("Ba lối vào này giúp bạn khám phá thông tin, không phải ba nhóm tách biệt hoàn toàn: Duales Studium thuộc giáo dục đại học và có mô hình tích hợp cả đào tạo nghề.")).toBeInTheDocument();
    expect(screen.getByText("Vì vậy, không thể suy ra mọi Duales Studium đều cấp thêm một bằng nghề.")).toBeInTheDocument();
    expect(screen.getByText("Ausbildung có nhiều hình thức khác nhau. Không thể suy ra mọi chương trình đều có thù lao đào tạo, cùng yêu cầu đầu vào hoặc cùng cách tổ chức.")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Cần xác minh khi đi sâu" })).toHaveLength(3);
    expect(document.body).not.toHaveTextContent("Editorial boundary");
    expect(document.body).not.toHaveTextContent("Review triggers");
    expect(document.body).not.toHaveTextContent("2026-10-14");
  });

  it("preserves all comparison dimensions, credentials and overlap in a semantic table", () => {
    renderStudy();
    const table = screen.getByRole("table", { name: "Vừa học vừa làm trong Ausbildung và Duales Studium có gì giống, khác và giao nhau?" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    expect(within(table).getAllByRole("rowheader").map(cell => cell.textContent)).toEqual([
      "Bản chất", "Những nơi học chính", "Kết quả đào tạo", "Quan hệ với doanh nghiệp", "Điều kiện cụ thể",
    ]);
    expect(within(table).getByText("Bằng đại học; mô hình ausbildungsintegrierend tích hợp thêm bằng nghề được công nhận")).toBeInTheDocument();
    for (const cell of within(table).getAllByRole("columnheader")) expect(cell).toHaveAttribute("scope", "col");
    for (const cell of within(table).getAllByRole("rowheader")) expect(cell).toHaveAttribute("scope", "row");
    expect(table.parentElement).toHaveAttribute("tabindex", "0");
    expect(table.parentElement).toHaveAccessibleDescription("Cuộn ngang để đọc đầy đủ bảng so sánh.");
  });

  it("preserves visible authoritative source attribution for each content unit", () => {
    renderStudy();
    const expected = [
      ["higher-education", ["daad.de", "hochschulkompass.de"]],
      ["vocational-training", ["arbeitsagentur.de", "make-it-in-germany.com", "make-it-in-germany.com", "hochschulkompass.de"]],
      ["dual-studies", ["bibb.de", "hochschulkompass.de", "daad.de"]],
      ["how-i-want-to-learn", ["daad.de", "arbeitsagentur.de", "bibb.de"]],
      ["learning-and-working", ["arbeitsagentur.de", "bibb.de", "hochschulkompass.de"]],
    ];
    for (const [id, domains] of expected) {
      const section = document.getElementById(id).closest("section");
      const links = within(section).getAllByRole("link").filter(link => link.getAttribute("href").startsWith("https:"));
      expect(links.map(link => new URL(link.href).hostname.replace(/^www\./, ""))).toEqual(domains);
      for (const link of links) {
        const source = studyContent.units.find(unit => unit.id === id).sources.find(source => source.url === link.href);
        expect(link).toHaveAccessibleName(source.title);
        expect(link).toBeVisible();
        expect(link.parentElement.querySelector("p")).toBeNull();
        expect(link).not.toHaveAttribute("target");
      }
    }
  });

  it("keeps source review metadata in the canonical pack without exposing reviewer instructions", () => {
    renderStudy();
    expect(screen.getAllByRole("heading", { name: "Nguồn tham khảo", level: 3 })).toHaveLength(5);
    for (const unit of studyContent.units) {
      for (const source of unit.sources) {
        expect(source.applicability).toEqual(expect.any(String));
        expect(source.applicability.length).toBeGreaterThan(0);
        expect(document.body).not.toHaveTextContent(source.applicability);
      }
      for (const note of [unit.sourceNote, unit.editorialBoundary, unit.reviewTriggers].filter(Boolean)) {
        expect(document.body).not.toHaveTextContent(note);
      }
    }
    expect(document.body).not.toHaveTextContent(studyContent.metadata.editorialStatus);
    expect(document.body).not.toHaveTextContent(studyContent.metadata.publicationStatus);
  });

  it("keeps entrance links and the overflow region in native keyboard order", async () => {
    renderStudy();
    const user = userEvent.setup();
    for (const [id] of units) {
      await user.tab();
      expect(document.activeElement).toHaveAttribute("href", "#" + id);
    }
    const links = [...document.querySelectorAll('a[href^="#"]')];
    expect(links).toHaveLength(17);
  });

  it("initializes a bookmarked fragment after mount and leaves unknown fragments alone", () => {
    const originalScroll = HTMLElement.prototype.scrollIntoView;
    const originalUrl = window.location.href;
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    try {
      window.history.replaceState(null, "", "#dual-studies");
      const view = renderStudy();
      expect(document.activeElement).toBe(document.getElementById("dual-studies"));
      expect(scroll).toHaveBeenCalledExactlyOnceWith({ block: "start", behavior: "instant" });
      view.unmount();
      scroll.mockClear();
      window.history.replaceState(null, "", "#not-approved");
      renderStudy();
      expect(scroll).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(document.body);
    } finally {
      window.history.replaceState(null, "", originalUrl);
      if (originalScroll) HTMLElement.prototype.scrollIntoView = originalScroll;
      else delete HTMLElement.prototype.scrollIntoView;
    }
  });
});
