import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";
import ResourceState from "./ResourceState";

describe("Vietnamese shared state defaults", () => {
  it("localizes the default loading message while preserving caller-owned children", () => {
    const { rerender } = render(<LoadingState />);
    expect(screen.getByText("Đang tải...")).toHaveAttribute("lang", "vi");
    rerender(<LoadingState><p lang="en">Fetching the lesson</p></LoadingState>);
    expect(screen.getByText("Fetching the lesson")).toHaveAttribute("lang", "en");
    expect(screen.queryByText("Đang tải...")).not.toBeInTheDocument();
  });

  it.each([
    [{ code: "ERR_NETWORK" }, "Lỗi kết nối", "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn."],
    [{ code: "NETWORK_ERROR", status: 403 }, "Lỗi kết nối", "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn."],
    [{ status: 401 }, "Đã xảy ra lỗi", "Đã xảy ra lỗi máy chủ không mong muốn. Vui lòng thử lại sau."],
    [{ status: 500 }, "Đã xảy ra lỗi", "Đã xảy ra lỗi máy chủ không mong muốn. Vui lòng thử lại sau."],
    [{ code: "ECONNABORTED" }, "Đã xảy ra lỗi", "Đã xảy ra lỗi máy chủ không mong muốn. Vui lòng thử lại sau."],
  ])("preserves classification and explicit retry for %j", async (error, title, description) => {
    const onRetry = vi.fn();
    const backendMessage = "Backend-owned message remains unchanged";
    const suppliedError = { ...error, message: backendMessage };
    const { rerender } = render(<ErrorState error={suppliedError} onRetry={onRetry} />);
    expect(screen.getByRole("heading", { name: title })).toHaveAttribute("lang", "vi");
    expect(screen.getByText(description)).toHaveAttribute("lang", "vi");
    const retry = screen.getByRole("button", { name: "Thử lại" });
    expect(retry).toHaveAttribute("lang", "vi");
    expect(onRetry).not.toHaveBeenCalled();
    await userEvent.setup().click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(suppliedError.message).toBe(backendMessage);
    rerender(<ErrorState error={suppliedError} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each([
    [403, "Không có quyền truy cập", "Bạn không có quyền truy cập tài nguyên này.", "forbidden"],
    [404, "Không tìm thấy tài nguyên", "Tài nguyên bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.", "notFound"],
  ])("preserves status %s and caller-owned action without introducing retry", (status, title, description, actionKey) => {
    const onRetry = vi.fn();
    render(<MemoryRouter><ErrorState error={{ status }} onRetry={onRetry}
      actions={{ [actionKey]: { to: "/learn-german", label: "Browse courses" } }} /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: title })).toHaveAttribute("lang", "vi");
    expect(screen.getByText(description)).toHaveAttribute("lang", "vi");
    const action = screen.getByRole("link", { name: "Browse courses" });
    expect(action).toHaveAttribute("href", "/learn-german");
    expect(action.closest('[lang="vi"]')).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("preserves ResourceState precedence, feature-owned empty copy, actions and successful content", () => {
    const props = { loading: true, error: { status: 500 }, empty: true,
      loadingProps: { children: <span lang="en">Loading courses</span> },
      emptyProps: { title: "No courses", description: "Explore the catalog", action: <button>Browse courses</button> } };
    const { rerender } = render(<ResourceState {...props}>Lesson content</ResourceState>);
    expect(screen.getByText("Loading courses")).toHaveAttribute("lang", "en");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    rerender(<ResourceState {...props} loading={false}>Lesson content</ResourceState>);
    expect(screen.getByRole("heading", { name: "Đã xảy ra lỗi" })).toBeInTheDocument();
    rerender(<ResourceState {...props} loading={false} error={null}>Lesson content</ResourceState>);
    expect(screen.getByRole("heading", { name: "No courses" })).toBeInTheDocument();
    expect(screen.getByText("Explore the catalog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse courses" }).closest('[lang="vi"]')).toBeNull();
    rerender(<ResourceState>Lesson content</ResourceState>);
    expect(screen.getByText("Lesson content")).toBeInTheDocument();
  });

  it("preserves the absent-error rendering behavior", () => {
    const { container } = render(<ErrorState />);
    expect(container).toBeEmptyDOMElement();
  });
});
