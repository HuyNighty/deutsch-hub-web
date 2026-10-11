import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { mountSession, seedSession } from "@/test/session-fixtures";
import { deferred, fail, setHttpHandler } from "@/test/http";
import LessonMediaRenderer from "./LessonMediaRenderer";
import LessonItemRenderer from "../LessonItemRenderer/LessonItemRenderer";

const NativeURL = URL;
const objectUrl = "blob:lesson-material";
let createObjectURL, revokeObjectURL;

beforeEach(() => {
  createObjectURL = vi.fn(() => objectUrl);
  revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", class extends NativeURL {
    static createObjectURL = createObjectURL;
    static revokeObjectURL = revokeObjectURL;
  });
});
afterEach(() => vi.unstubAllGlobals());

function setup(mimeType, { title, response } = {}) {
  seedSession();
  const blob = new Blob(["Grüße aus Köln"], { type: mimeType });
  const http = vi.fn((config) => {
    expect(config.method).toBe("get");
    expect(config.url).toBe("/me/courses/course/lessons/lesson/items/material/media");
    expect(config.responseType).toBe("blob");
    return response ? response(config, blob) : { config, status: 200, headers: {}, data: blob };
  });
  setHttpHandler(http);
  const app = mountSession([{ path: "/", element: <LessonMediaRenderer courseId="course"
    lessonId="lesson" itemId="material" title={title} description="Ä, Ö, Ü, ß" /> }], { strict: false });
  return { ...app, blob, http };
}

describe("localized lesson materials through the existing blob hook", () => {
  it.each([
    ["image/png", "img"], ["video/mp4", "video"], ["audio/mpeg", "audio"],
    ["application/pdf", "iframe"], ["text/plain", "a"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "a"],
  ])("preserves %s requests, resource attributes and URL cleanup", async (mimeType, tag) => {
    const app = setup(mimeType, { title: tag === "a" ? "Grüße Dokument" : undefined });
    await screen.findByText("Ä, Ö, Ü, ß");
    await vi.waitFor(() => expect(app.container.querySelector(tag)).not.toBeNull());
    const resource = app.container.querySelector(tag);
    if (tag !== "video" && tag !== "audio") {
      expect(resource).toHaveAttribute(tag === "a" ? "href" : "src", objectUrl);
    }
    if (tag === "img") {
      expect(resource).toHaveAttribute("alt", "Tài liệu bài học");
      expect(resource).toHaveAttribute("loading", "lazy");
    }
    if (tag === "iframe") expect(resource).toHaveAttribute("title", "Tài liệu PDF của bài học");
    if (tag === "video" || tag === "audio") {
      // Existing media sources remain nested in the native controls.
      expect(resource).toHaveAttribute("controls");
      expect(resource.querySelector("source")).toHaveAttribute("src", objectUrl);
      expect(resource.querySelector("source")).toHaveAttribute("type", mimeType);
    }
    if (tag === "a") {
      expect(resource).toHaveAccessibleName("Tải tài liệu");
      expect(resource).toHaveAttribute("download", "Grüße Dokument");
      expect(screen.getByText("Không thể xem trước tài liệu này.")).toBeVisible();
    }
    expect(createObjectURL).toHaveBeenCalledWith(app.blob);
    expect(app.client.getQueryData(["lesson-item-media", "course", "lesson", "material"])).toBe(app.blob);
    expect(app.http).toHaveBeenCalledTimes(1);
    app.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });

  it("preserves authored image names instead of replacing them with translated fallback text", async () => {
    const app = setup("image/png", { title: "Grüße aus München" });
    expect(await screen.findByRole("img", { name: "Grüße aus München" })).toHaveAttribute("src", objectUrl);
    expect(screen.getByRole("heading", { name: "Grüße aus München" })).toBeVisible();
    app.unmount();
  });

  it("localizes the pending state while retaining authored metadata and settling the original request", async () => {
    const pending = deferred();
    const app = setup("image/png", { title: "Grüße", response: (config, blob) =>
      pending.promise.then(() => ({ config, status: 200, headers: {}, data: blob })) });
    expect(screen.getByText("Đang tải tài liệu...")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Grüße" })).toBeVisible();
    await act(async () => pending.resolve());
    expect(await screen.findByRole("img", { name: "Grüße" })).toBeVisible();
    expect(app.http).toHaveBeenCalledTimes(1);
    app.unmount();
  });

  it("localizes material errors without disclosing private details or creating a resource URL", async () => {
    const app = setup("image/png", { response: (config) => fail(config, 403) });
    expect(await screen.findByText("Không thể tải tài liệu bài học này.")).toBeVisible();
    expect(screen.queryByText("HTTP failure")).not.toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
    app.unmount();
  });

  it("retains unsupported MIME and item types with localized interface text", async () => {
    const app = setup("chemical/x-pdb");
    expect(await screen.findByText("Định dạng tài liệu không được hỗ trợ.")).toBeVisible();
    app.unmount();
    const item = mountSession([{ path: "/", element: <LessonItemRenderer courseId="course" lessonId="lesson"
      items={[{ id: "unknown", type: "OTHER" }]} /> }]);
    expect(screen.getByText("Loại nội dung bài học chưa được hỗ trợ: OTHER")).toBeVisible();
    item.unmount();
  });
});
