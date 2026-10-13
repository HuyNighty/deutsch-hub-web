import { test, expect } from "@playwright/test";
import { surfaces } from "../src/surfaces.js";

async function snapshot(page) {
  return page.locator("body").evaluate((body) => [...body.querySelectorAll("*")].filter((element) => element.tagName !== "SCRIPT").map((element) => {
    const rect = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    return { tag: element.tagName, text: element.textContent, checked: element.checked, disabled: element.disabled,
      rect: [rect.x, rect.y, rect.width, rect.height], font: css.font, lineHeight: css.lineHeight,
      color: css.color, background: css.backgroundColor, border: css.border, padding: css.padding,
      overflow: [element.scrollWidth, element.scrollHeight] };
  }));
}

for (const width of [1440, 375, 320]) {
  for (const contextId of Object.keys(surfaces)) {
    test(`${width}px/${contextId}: immutable P3-A versus combined build, both models`, async ({ page, context }, info) => {
      const baseline = await context.newPage();
      const errors = [];
      const requests = [];
      for (const instance of [page, baseline]) {
        instance.on("pageerror", (error) => errors.push(error.message));
        instance.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));
        await instance.setViewportSize({ width, height: 1000 });
      }
      await page.goto("/index.html");
      await baseline.goto("http://127.0.0.1:5181/index.html");
      const samples = [];
      for (const model of ["A", "B"]) {
        for (const instance of [page, baseline]) {
          await instance.getByRole("combobox", { name: "Bối cảnh" }).selectOption(contextId);
          await instance.getByRole("radio", { name: `Mẫu ${model}` }).check();
          await instance.evaluate(() => document.fonts.ready);
        }
        const current = await snapshot(page);
        const original = await snapshot(baseline);
        expect(current).toEqual(original);
        const fills = await page.getByTestId("specimen").evaluate((main) => ({ canvas: getComputedStyle(main).backgroundColor, reading: getComputedStyle(main.querySelector("article")).backgroundColor, scroll: [scrollX, scrollY], viewport: innerWidth, documentWidth: document.documentElement.scrollWidth }));
        expect(fills.documentWidth).toBeLessThanOrEqual(fills.viewport);
        const color = (hex) => `rgb(${[1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(", ")})`;
        expect(fills.canvas).toBe(color(surfaces[contextId].canvas));
        expect(fills.reading).toBe(color(surfaces[contextId][model]));
        if (contextId === "assessment") {
          await expect(page.getByRole("checkbox").nth(0)).toBeChecked();
          await expect(page.getByRole("checkbox").nth(1)).not.toBeChecked();
          await expect(page.getByRole("checkbox").nth(1)).toBeDisabled();
        }
        samples.push({ model, fills, current });
      }
      expect(errors).toEqual([]);
      expect(requests.every(({ method, url }) => method === "GET" && ["http://127.0.0.1:5180", "http://127.0.0.1:5181"].includes(new URL(url).origin) && /^\/(index\.html|assets\/)/.test(new URL(url).pathname))).toBe(true);
      await info.attach("paired-static-geometry", { body: JSON.stringify({ width, contextId, samples, requests }), contentType: "application/json" });
      await baseline.close();
    });
  }
}
