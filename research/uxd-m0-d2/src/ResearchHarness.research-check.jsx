import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ResearchHarness from "./ResearchHarness";
import Specimen from "./Specimen";
import { surfaces } from "./surfaces";

describe("Isolated static research harness", () => {
  it.each(Object.keys(surfaces))("%s changes only reading fill inside its specimen", (contextId) => {
    const { rerender } = render(<Specimen contextId={contextId} model="A" />);
    const panelA = screen.getByTestId("reading-panel").outerHTML;
    const regionA = screen.getByTestId("specimen").cloneNode(true);
    regionA.style.removeProperty("--research-reading-fill");
    rerender(<Specimen contextId={contextId} model="B" />);
    const regionB = screen.getByTestId("specimen").cloneNode(true);
    expect(screen.getByTestId("specimen").style.getPropertyValue("--research-reading-fill")).toBe(surfaces[contextId].B);
    regionB.style.removeProperty("--research-reading-fill");
    expect(screen.getByTestId("reading-panel").outerHTML).toBe(panelA);
    expect(regionB.outerHTML).toBe(regionA.outerHTML);
  });

  it("exposes all eight combinations with the same notice outside the specimen", () => {
    render(<ResearchHarness />);
    const notice = screen.getByRole("note", { name: "Thông tin nghiên cứu" });
    expect(notice).toHaveTextContent("không kết nối API trực tiếp");
    const noticeText = notice.textContent;
    for (const contextId of Object.keys(surfaces)) {
      fireEvent.change(screen.getByLabelText("Bối cảnh"), { target: { value: contextId } });
      for (const model of ["A", "B"]) {
        fireEvent.click(screen.getByRole("radio", { name: `Mẫu ${model}` }));
        expect(screen.getByTestId("specimen").style.getPropertyValue("--research-canvas")).toBe(surfaces[contextId].canvas);
        expect(screen.getByTestId("specimen").style.getPropertyValue("--research-reading-fill")).toBe(surfaces[contextId][model]);
        expect(screen.getByRole("note").textContent).toBe(noticeText);
        expect(screen.getByTestId("specimen")).not.toContainElement(notice);
        expect(within(screen.getByTestId("specimen")).getAllByRole("heading", { level: 1 })).toHaveLength(1);
      }
    }
  });

  it("keeps saved checkbox A selected and B unselected without a focus or correctness simulation", () => {
    render(<ResearchHarness />);
    fireEvent.change(screen.getByLabelText("Bối cảnh"), { target: { value: "assessment" } });
    const specimen = screen.getByTestId("specimen");
    const [a, b] = within(specimen).getAllByRole("checkbox");
    expect(a).toBeChecked();
    expect(b).not.toBeChecked();
    expect(a).toBeDisabled();
    expect(b).toBeDisabled();
    expect(document.activeElement).not.toBe(b);
    expect(specimen.textContent).not.toMatch(/đúng|sai|điểm|đạt|correct|incorrect|passed|SUBMITTED|COMPLETED/i);
    expect(specimen.querySelector('[lang="de"]')).not.toBeNull();
  });

  it("keeps course continuation distinct from the next lesson, without navigation or unsupported capabilities", () => {
    render(<ResearchHarness />);
    fireEvent.change(screen.getByLabelText("Bối cảnh"), { target: { value: "myLearning" } });
    const specimen = screen.getByTestId("specimen");
    expect(within(specimen).getByRole("button", { name: "Tiếp tục học" })).toBeDisabled();
    expect(within(specimen).getByRole("button", { name: /Mở bài học tiếp theo/ })).toBeDisabled();
    expect(within(specimen).getByText("3 / 8 bài học")).toBeInTheDocument();
    expect(within(specimen).getByText("37.5%")).toBeInTheDocument();
    expect(within(specimen).queryByRole("link")).not.toBeInTheDocument();
    expect(specimen.textContent).not.toMatch(/streak|bookmark|newsletter|cộng đồng|phút|lần cuối|đề xuất/i);
  });

  it("keeps every runtime import inside research or the two installed React packages", () => {
    const src = path.dirname(fileURLToPath(import.meta.url));
    function inspect(directory) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) { inspect(file); continue; }
        if (!/\.(js|jsx|css)$/.test(file) || /research-check|test-setup/.test(entry.name)) continue;
        const source = readFileSync(file, "utf8");
        const imports = [...source.matchAll(/\bimport\s+(?:[^;]*?\sfrom\s+)?["']([^"']+)["']/g)].map((match) => match[1]);
        for (const specifier of imports) {
          if (["react", "react-dom/client"].includes(specifier)) continue;
          expect(specifier.startsWith(".")).toBe(true);
          const resolved = path.resolve(directory, specifier);
          expect(resolved.startsWith(src)).toBe(true);
        }
        expect(source).not.toMatch(/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\b(localStorage|sessionStorage|indexedDB)\b|\bimport\s*\(/);
        expect(source).not.toMatch(/https?:\/\/|@import|url\(/);
      }
    }
    inspect(src);
  });
});
