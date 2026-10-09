import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SkillGuidance from "./SkillGuidance";
import * as catalog from "./skill-guidance";

describe("Approved guidance rendering", () => {
  it("preserves A2 Writing paragraphs and safely emphasizes only the approved conjunctions", () => {
    const entry = catalog.guidanceEntries.find((item) => item.id === "writing.a2.not_passed");
    render(<SkillGuidance targetLevel="A2" skillDimension="WRITING" passed={false} />);
    const section = screen.getByRole("region", { name: "Gợi ý học tập kỹ năng Viết" });
    expect(section).toHaveAttribute("lang", "vi");
    expect([...section.querySelectorAll("p")].map((paragraph) => paragraph.textContent))
      .toEqual(entry.content.split("\n\n").map((paragraph) => paragraph.replace(/\*(und|aber|weil|deshalb)\*/g, "$1")));
    expect([...section.querySelectorAll("em")].map((element) => element.textContent))
      .toEqual(["und", "aber", "weil", "deshalb"]);
    expect(section.textContent).not.toContain("*");
  });

  it("renders markup as text instead of introducing HTML, links or general Markdown", () => {
    const content = '<img src=x onerror="alert(1)"> [link](https://example.com) **bold** *other*';
    vi.spyOn(catalog, "selectSkillGuidance").mockReturnValue({ id: "test", content });
    render(<SkillGuidance targetLevel="A1" skillDimension="READING" passed={false} />);
    const section = screen.getByRole("region", { name: "Gợi ý học tập kỹ năng Đọc" });
    expect(section.querySelector("p").textContent).toBe(content);
    expect(section.querySelector("img, a, strong, em, script")).toBeNull();
  });
});
