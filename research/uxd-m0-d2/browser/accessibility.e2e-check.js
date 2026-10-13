import { test, expect, chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

test.beforeEach(async ({ page }) => {
  page.researchErrors = [];
  page.researchRequests = [];
  page.on("pageerror", (error) => page.researchErrors.push(error.message));
  page.on("request", (request) => page.researchRequests.push({ method: request.method(), url: request.url() }));
  await page.goto("/interaction.html");
});
test.afterEach(async ({ page }, info) => {
  await info.attach("network", { body: JSON.stringify(page.researchRequests), contentType: "application/json" });
  expect(page.researchErrors).toEqual([]);
  expect(page.researchRequests.every(({ method, url }) => method === "GET" && new URL(url).origin === "http://127.0.0.1:5180" && /^\/(interaction\.html|assets\/)/.test(new URL(url).pathname))).toBe(true);
});

async function audit(page, info) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  await info.attach("axe", { body: JSON.stringify(results), contentType: "application/json" });
  expect(results.violations).toEqual([]);
}

for (const model of ["A", "B"]) {
  for (const phase of ["idle", "pending", "confirmed", "error", "uncertain", "submitted"]) {
    test(`axe ${model}/Assessment/${phase}`, async ({ page }, info) => {
      await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
      if (phase === "submitted") {
        await page.getByRole("button", { name: "Bắt đầu mô phỏng nộp bài tập" }).click();
        await page.getByRole("button", { name: "Xác nhận kịch bản" }).click();
      } else if (phase !== "idle") {
        await page.getByRole("checkbox").nth(1).check();
        await page.getByRole("button", { name: "Bắt đầu mô phỏng lưu", exact: true }).click();
        if (phase !== "pending") await page.getByRole("button", { name: { confirmed: "Xác nhận kịch bản", error: "Lỗi xác định", uncertain: "Kết quả chưa xác định" }[phase], exact: true }).click();
      }
      await audit(page, info);
    });
  }
  for (const scenario of ["R1", "R2", "R3"]) {
    test(`axe ${model}/Returning/${scenario}, including destination`, async ({ page }, info) => {
      await page.getByRole("combobox", { name: "Chế độ", exact: true }).selectOption("returning");
      await page.getByRole("combobox", { name: "Tình huống quay lại" }).selectOption(scenario);
      await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
      await audit(page, info);
      await page.getByRole("button", { name: { R1: "Mở bài học tiếp theo", R2: "Tiếp tục bài tập", R3: "Khám phá khóa học" }[scenario] }).click();
      await audit(page, info);
    });
  }

  test(`${model}: 320 CSS-pixel reflow and real focused controls remain visible`, async ({ page }, info) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
    const modes = [{ mode: "assessment" }, ...["R1", "R2", "R3"].map((scenario) => ({ mode: "returning", scenario }))];
    const geometry = [];
    for (const { mode, scenario } of modes) {
      await page.getByRole("combobox", { name: "Chế độ", exact: true }).selectOption(mode);
      if (scenario) await page.getByRole("combobox", { name: "Tình huống quay lại" }).selectOption(scenario);
      await page.getByRole("button", { name: "Đặt lại nghiên cứu" }).click();
      const target = mode === "assessment" ? page.getByRole("checkbox").nth(1) : page.getByTestId("interaction-specimen").getByRole("button").first();
      // Traverse the real tab order. No scroll injection or artificial focus.
      for (let tabs = 0; tabs < 5 && !(await target.evaluate((element) => element === document.activeElement)); tabs++) await page.keyboard.press("Tab");
      await expect(target).toBeFocused();
      const metrics = await target.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { rect: [rect.x, rect.y, rect.width, rect.height], viewport: [innerWidth, innerHeight], documentWidth: document.documentElement.scrollWidth, scroll: [scrollX, scrollY], outline: getComputedStyle(element).outlineWidth, horizontalOverflow: [...document.querySelectorAll("header, main, main *")].filter((node) => node.getBoundingClientRect().right > innerWidth + 1).map((node) => node.tagName) };
      });
      expect(metrics.documentWidth).toBeLessThanOrEqual(320);
      expect(metrics.horizontalOverflow).toEqual([]);
      expect(metrics.rect[0]).toBeGreaterThanOrEqual(0);
      expect(metrics.rect[1]).toBeGreaterThanOrEqual(0);
      expect(metrics.rect[0] + metrics.rect[2]).toBeLessThanOrEqual(320);
      expect(metrics.rect[1] + metrics.rect[3]).toBeLessThanOrEqual(900);
      expect(metrics.outline).toBe("3px");
      if (mode === "assessment") {
        await page.keyboard.press("Space");
        await expect(target).toBeChecked();
        await expect(page.getByTestId("saved-selection")).toHaveText("A");
      } else {
        await page.keyboard.press("Enter");
        await expect(page.getByTestId("research-destination")).toBeVisible();
      }
      geometry.push({ mode, scenario, metrics });
    }
    await info.attach("reflow-focus-geometry", { body: JSON.stringify(geometry), contentType: "application/json" });
    await page.screenshot({ path: info.outputPath(`returning-${model}-320.png`), fullPage: true });
  });
}

test("reduced-motion preference emulation is respected without layout animation", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const animated = await page.locator("header, main").evaluateAll((roots) => roots.flatMap((root) => [root, ...root.querySelectorAll("*")]).filter((element) => {
    const css = getComputedStyle(element);
    return css.animationName !== "none" || css.transitionDuration.split(",").some((duration) => parseFloat(duration) !== 0);
  }).map((element) => element.tagName));
  expect(animated).toEqual([]);
  await info.attach("manual-coverage-boundaries", { body: JSON.stringify({ assistiveTechnology: "NOT RUN: no screen-reader session", reducedMotion: "PASS: Chromium media preference emulation and computed styles" }), contentType: "application/json" });
});

for (const model of ["A", "B"]) {
  for (const setting of ["native-200-percent-zoom", "native-200-percent-text"]) {
    test(`${model}: ${setting} reflow and keyboard usability`, async ({ browserName }, info) => {
      expect(browserName).toBe("chromium");
      const samples = [];
      for (const enlarged of [false, true]) {
        const zoom = enlarged && setting === "native-200-percent-zoom" ? 2 : 1;
        const font = enlarged && setting === "native-200-percent-text" ? 32 : 16;
        const profile = info.outputPath(enlarged ? "enlarged-profile" : "control-profile");
        await fs.mkdir(path.join(profile, "Default"), { recursive: true });
        // Native Chromium preferences in disposable profiles. No page CSS,
        // device-scale override, pinch zoom or transform is used.
        await fs.writeFile(path.join(profile, "Default/Preferences"), JSON.stringify({
          partition: { default_zoom_level: { x: Math.log(zoom) / Math.log(1.2) } },
          webkit: { webprefs: { default_font_size: font, default_fixed_font_size: font } },
        }), { flag: "wx" });
        const session = await chromium.launchPersistentContext(profile, { channel: "chromium", headless: true, viewport: null, args: ["--window-size=1280,900"] });
        try {
          const page = await session.newPage();
          const requests = [];
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));
          await page.goto("http://127.0.0.1:5180/interaction.html");
          await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
          const metrics = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, outerWidth, dpr: devicePixelRatio, visualScale: visualViewport.scale, rootFont: getComputedStyle(document.documentElement).fontSize, harnessFont: getComputedStyle(document.querySelector("#interaction-root > div")).fontSize }));
          expect(metrics.rootFont).toBe(`${font}px`);
          expect(metrics.harnessFont).toBe(`${font}px`);
          expect(metrics.visualScale).toBe(1);
          for (const scenario of ["assessment", "R1", "R2", "R3"]) {
            await page.getByRole("combobox", { name: "Chế độ", exact: true }).selectOption(scenario === "assessment" ? "assessment" : "returning");
            if (scenario !== "assessment") await page.getByRole("combobox", { name: "Tình huống quay lại" }).selectOption(scenario);
            await page.getByRole("button", { name: "Đặt lại nghiên cứu" }).click();
            const target = scenario === "assessment" ? page.getByRole("checkbox").nth(1) : page.getByTestId("interaction-specimen").getByRole("button").first();
            for (let tabs = 0; tabs < 5 && !(await target.evaluate((element) => element === document.activeElement)); tabs++) await page.keyboard.press("Tab");
            await expect(target).toBeFocused();
            const geometry = await target.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, rect: [rect.x, rect.y, rect.width, rect.height], outline: getComputedStyle(element).outlineWidth };
            });
            expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
            expect(geometry.rect[0]).toBeGreaterThanOrEqual(0);
            expect(geometry.rect[1]).toBeGreaterThanOrEqual(0);
            expect(geometry.rect[0] + geometry.rect[2]).toBeLessThanOrEqual(geometry.width);
            expect(geometry.rect[1] + geometry.rect[3]).toBeLessThanOrEqual(geometry.height);
            expect(geometry.outline).toBe("3px");
            await page.keyboard.press(scenario === "assessment" ? "Space" : "Enter");
            if (scenario === "assessment") {
              await expect(target).toBeChecked();
              await expect(page.getByTestId("saved-selection")).toHaveText("A");
            } else await expect(page.getByTestId("research-destination")).toBeVisible();
          }
          expect(errors).toEqual([]);
          expect(requests.every(({ method, url }) => method === "GET" && new URL(url).origin === "http://127.0.0.1:5180" && /^\/(interaction\.html|assets\/)/.test(new URL(url).pathname))).toBe(true);
          samples.push({ enlarged, zoom, font, metrics, requests });
        } finally { await session.close(); }
      }
      if (setting === "native-200-percent-zoom") {
        expect(samples[1].metrics.dpr / samples[0].metrics.dpr).toBe(2);
        expect(samples[1].metrics.width * 2).toBeCloseTo(samples[0].metrics.width, 0);
        expect(samples[1].metrics.outerWidth).toBe(samples[0].metrics.outerWidth);
      } else {
        expect(samples[1].metrics.dpr).toBe(samples[0].metrics.dpr);
        expect(samples[1].metrics.width).toBe(samples[0].metrics.width);
      }
      await info.attach("native-enlargement", { body: JSON.stringify({ setting, model, samples }), contentType: "application/json" });
    });
  }
}
