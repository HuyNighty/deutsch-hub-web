import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { setHttpHandler } from "@/test/http";
import Footer from "./Footer";

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe("Vietnamese Footer", () => {
  it("preserves ordered destinations, branding and copyright with localized copy and accessible names", async () => {
    const requests = [];
    setHttpHandler((config) => { requests.push(config); throw new Error("Unexpected Footer request"); });
    render(<MemoryRouter initialEntries={["/experiences"]}><Footer /><Location /></MemoryRouter>);
    const footer = screen.getByRole("contentinfo");
    const content = within(footer);
    expect(footer).toHaveAttribute("lang", "vi");
    expect(content.getByRole("link", { name: "Trang chủ DeutschHub" })).toHaveAttribute("href", "/");
    const features = content.getByRole("navigation", { name: "Điều hướng tính năng" });
    expect(within(features).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]))
      .toEqual([["Học tiếng Đức", "/learn-german"], ["Khám phá nước Đức", "/explore-germany"],
        ["Du học Đức", "/study-in-germany"], ["Giao lưu", "/experiences"]]);
    const platform = content.getByRole("navigation", { name: "Điều hướng DeutschHub" });
    expect(within(platform).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]))
      .toEqual([["Về DeutschHub", "/"], ["Tài khoản", "/account"]]);
    expect(content.getByRole("heading", { name: "Khám phá" })).toBeInTheDocument();
    expect(content.getByRole("heading", { name: "DeutschHub" })).toBeInTheDocument();
    expect(content.getByText("Học tiếng Đức, tìm hiểu nước Đức và xây dựng tương lai của bạn trên cùng một nền tảng."))
      .toBeInTheDocument();
    expect(content.getByText("Học tập · Khám phá · Kết nối")).toBeInTheDocument();
    expect(content.getByText("© 2026 DeutschHub")).toBeInTheDocument();
    expect(requests).toEqual([]);
    await userEvent.setup().click(within(features).getByRole("link", { name: "Học tiếng Đức" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/learn-german");
    expect(requests).toEqual([]);
  });
});
